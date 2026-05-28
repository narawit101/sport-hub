const express = require("express");
const router = express.Router();
const pool = require("../config/db");
const authMiddleware = require("../middlewares/auth");
const { createUploader } = require("../utils/upload");
const { deleteCloudinaryFile } = require("../utils/delete");
const { getCache, setCache, invalidateCache, invalidatePattern } = require("../config/cache");
const { USER_ROLE } = require("../utils/constants");

const upload = createUploader(
  { img_url: "uploads/images/posts" },
  { maxFiles: 10 }
);


router.post(
  "/post",
  authMiddleware,
  upload.array("img_url"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { title, content, field_id } = req.body;
      const user_id = req.user.user_id;

      const fieldOwner = await pool.query(
        `SELECT user_id FROM field WHERE field_id = $1`,
        [field_id]
      );

      if (fieldOwner.rows.length === 0) {
        return res.status(404).json({ message: "Field not found" });
      }

      const field_user_id = fieldOwner.rows[0].user_id;

      if (req.user.role !== USER_ROLE.ADMIN && field_user_id !== user_id) {
        return res
          .status(403)
          .json({ message: "You do not have permission to post" });
      }

      await client.query("BEGIN");

      const newPost = await client.query(
        `INSERT INTO posts (title, content, field_id) VALUES ($1, $2, $3) RETURNING post_id`,
        [title, content, field_id]
      );

      const postId = newPost.rows[0].post_id;

      if (req.files && req.files.length > 0) {
        for (const image of req.files) {
          await client.query(
            `INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)`,
            [postId, image.path]
          );
        }
      }
      const insertedPost = await client.query(
        `SELECT 
           p.post_id,
           p.field_id,
           p.title,
           p.content,
           p.created_at,
           COALESCE(
             json_agg(json_build_object('image_url', pi.image_url)) 
             FILTER (WHERE pi.image_url IS NOT NULL), '[]'
           ) AS images
         FROM posts p
         LEFT JOIN post_images pi ON p.post_id = pi.post_id
         WHERE p.post_id = $1
         GROUP BY p.post_id`,
        [postId]
      );

      const fieldNameRes = await client.query(
        `SELECT field_name, img_field FROM field WHERE field_id = $1`,
        [field_id]
      );
      const fieldInfo = fieldNameRes.rows[0];

      const io = req.app?.get("io") || req.io;
      if (io) {
        console.log("ส่ง socket event: new_post_created", {
          fieldId: field_id,
          post: insertedPost.rows[0],
        });

        io.emit("new_post_created", {
          fieldId: Number(field_id),
          post: insertedPost.rows[0],
        });

        io.emit("home_new_post", {
          ...insertedPost.rows[0],
          field_name: fieldInfo?.field_name || "Unknown Field",
          img_field: fieldInfo?.img_field || null,
        });

        console.log("ส่ง socket event สำเร็จสำหรับสนาม", field_id);
      } else {
        console.log("ไม่พบ io socket connection");
      }
      try {
        const allUser = await pool.query(
          `SELECT fo.user_id FROM following fo WHERE fo.field_id = $1`,
          [field_id]
        );
        const fieldNameRes = await pool.query(
          `SELECT field_name FROM field WHERE field_id = $1`,
          [field_id]
        );
        const fieldName = fieldNameRes.rows[0]?.field_name || "มีโพสต์ใหม่";
        for (const a of allUser.rows) {
          await pool.query(
            `INSERT INTO notifications (sender_id, recive_id, topic, messages, key_id, status)
             VALUES ($1,$2,$3,$4,$5,'unread')`,
            [user_id || null, a.user_id, "field_posted", fieldName, postId]
          );
          if (io) {
            io.to(a.user_id.toString()).emit("new_notification", {
              topic: "field_posted",
              reciveId: a.user_id,
              keyId: postId,
            });
          }
        }
      } catch (notifyErr) {
        console.error(
          "Create/send field_posted notification failed:",
          notifyErr.message
        );
      }
      await client.query("COMMIT");
      await invalidateCache(`posts:field:${field_id}`);
      await invalidatePattern("posts:latest:*");
      await invalidatePattern("posts:following:*");
      res.status(201).json({
        message: "Post created successfully",
        post: insertedPost.rows[0],
      });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error creating post:", error);
      res.status(500).json({ message: "Internal server error" });
    } finally {
      client.release();
    }
  }
);

router.get("/feed/following", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.user_id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const cacheKey = `posts:following:${userId}:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ data: cached });
    }

    const result = await pool.query(
      `SELECT 
          p.post_id,
          p.field_id,
          p.title,
          p.content,
          f.field_name,
          f.img_field,
          p.created_at,
          COALESCE(
            json_agg(
              json_build_object('image_url', pi.image_url)
            ) FILTER (WHERE pi.image_url IS NOT NULL), '[]'
          ) AS images
        FROM posts p
        JOIN following fo ON p.field_id = fo.field_id
        LEFT JOIN field f ON p.field_id = f.field_id
        LEFT JOIN post_images pi ON p.post_id = pi.post_id
        WHERE fo.user_id = $1
        GROUP BY p.post_id, f.field_name, f.img_field
        ORDER BY p.created_at DESC
        LIMIT $2 OFFSET $3;`,
      [userId, limit, offset]
    );

    const data = result.rows || [];
    if (data.length === 0) {
      return res.status(200).json({ message: "ไม่มีโพส" });
    }

    await setCache(cacheKey, data, 300);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลโพสที่ติดตาม" });
  }
});

router.get("/:field_id", async (req, res) => {
  try {
    const { field_id } = req.params;
    const cacheKey = `posts:field:${field_id}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ data: cached });
    }

    const result = await pool.query(
      `SELECT 
          p.post_id,
          p.field_id,
          p.title,
          p.content,
          f.field_name,
          f.img_field,
          p.created_at,
          COALESCE(
            json_agg(
              json_build_object('image_url', pi.image_url)
            ) FILTER (WHERE pi.image_url IS NOT NULL), '[]'
          ) AS images
        FROM posts p
        LEFT JOIN field f ON p.field_id = f.field_id
        LEFT JOIN post_images pi ON p.post_id = pi.post_id
        WHERE p.field_id = $1
        GROUP BY p.post_id, f.field_name, f.img_field
        ORDER BY p.created_at DESC;`,
      [field_id]
    );

    const data = result.rows || [];
    if (data.length === 0) {
      return res.status(200).json({ message: "ไม่มีโพส" });
    }

    await setCache(cacheKey, data, 300); 
    res.status(200).json({ data });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลโพส" });
  }
});

router.get("/", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const offset = (page - 1) * limit;

    const cacheKey = `posts:latest:${page}:${limit}`;
    const cached = await getCache(cacheKey);
    if (cached) {
      return res.status(200).json({ data: cached });
    }

    const result = await pool.query(
      `SELECT 
          p.post_id,
          p.field_id,
          p.title,
          p.content,
          f.field_name,
          f.img_field,
          p.created_at,
          COALESCE(
            json_agg(
              json_build_object('image_url', pi.image_url)
            ) FILTER (WHERE pi.image_url IS NOT NULL), '[]'
          ) AS images
        FROM posts p
        LEFT JOIN field f ON p.field_id = f.field_id
        LEFT JOIN post_images pi ON p.post_id = pi.post_id
        GROUP BY p.post_id, f.field_name, f.img_field
        ORDER BY p.created_at DESC
        LIMIT $1 OFFSET $2;`,
      [limit, offset]
    );

    const data = result.rows || [];
    if (data.length === 0) {
      return res.status(200).json({ message: "ไม่มีโพส" });
    }

    await setCache(cacheKey, data, 300);
    res.status(200).json({ data });
  } catch (error) {
    console.error("Database Error:", error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลโพส" });
  }
});

router.patch(
  "/update/:post_id",
  authMiddleware,
  upload.array("img_url"),
  async (req, res) => {
    const client = await pool.connect();
    try {
      const { post_id } = req.params;
      const { title, content, deleted_images } = req.body;
      const user_id = req.user.user_id;

      const result = await client.query(
        `SELECT p.*, f.user_id AS field_owner FROM posts p JOIN field f ON p.field_id = f.field_id WHERE p.post_id = $1`,
        [post_id]
      );
      const post = result.rows[0];

      if (!post) return res.status(404).json({ message: "Post not found" });
      if (req.user.role !== USER_ROLE.ADMIN && post.field_owner !== user_id)
        return res.status(403).json({ message: "Permission denied" });

      await client.query("BEGIN");

      await client.query(
        `UPDATE posts SET title = $1, content = $2 WHERE post_id = $3`,
        [title, content, post_id]
      );

      // Handle deleted images
      if (deleted_images) {
        const toDelete = Array.isArray(deleted_images) 
          ? deleted_images 
          : JSON.parse(deleted_images);
          
        if (toDelete.length > 0) {
          for (const url of toDelete) {
            await deleteCloudinaryFile(url);
            await client.query(
              `DELETE FROM post_images WHERE post_id = $1 AND image_url = $2`,
              [post_id, url]
            );
          }
        }
      }

      if (req.files && req.files.length > 0) {
        for (const img of req.files) {
          await client.query(
            `INSERT INTO post_images (post_id, image_url) VALUES ($1, $2)`,
            [post_id, img.path]
          );
        }
      }

      await client.query("COMMIT");
      await invalidateCache(`posts:field:${post.field_id}`);
      await invalidatePattern("posts:latest:*");
      await invalidatePattern("posts:following:*");
      const updated = await client.query(
        `
      SELECT 
        p.post_id,
        p.field_id,
        p.title,
        p.content,
        p.created_at,
        COALESCE(
          json_agg(
            json_build_object('image_id', pi.image_id, 'image_url', pi.image_url)
          ) FILTER (WHERE pi.image_url IS NOT NULL), '[]'
        ) AS images
      FROM posts p
      LEFT JOIN post_images pi ON p.post_id = pi.post_id
      WHERE p.post_id = $1
      GROUP BY p.post_id
    `,
        [post_id]
      );

      res.status(200).json(updated.rows[0]);
    } catch (err) {
      await client.query("ROLLBACK");
      console.error(err);
      res.status(500).json({ message: "Update failed" });
    } finally {
      client.release();
    }
  }
);

router.delete("/delete/:post_id", authMiddleware, async (req, res) => {
  const { post_id } = req.params;
  const user_id = req.user.user_id;

  try {
    const result = await pool.query(
      `SELECT p.*, f.user_id AS field_owner FROM posts p JOIN field f ON p.field_id = f.field_id WHERE p.post_id = $1`,
      [post_id]
    );
    const post = result.rows[0];

    if (!post) return res.status(404).json({ message: "Post not found" });
    if (req.user.role !== USER_ROLE.ADMIN && post.field_owner !== user_id)
      return res.status(403).json({ message: "Permission denied" });

    const images = await pool.query(
      `SELECT image_url FROM post_images WHERE post_id = $1`,
      [post_id]
    );

    for (const img of images.rows) {
      await deleteCloudinaryFile(img.image_url);
    }

    await pool.query(`DELETE FROM post_images WHERE post_id = $1`, [post_id]);
    await pool.query(`DELETE FROM posts WHERE post_id = $1`, [post_id]);

    const io = req.app?.get("io") || req.io;
    if (io) {
      console.log("ส่ง socket event: post_deleted", {
        fieldId: post.field_id,
        postId: Number(post_id),
      });

      io.emit("post_deleted", {
        fieldId: Number(post.field_id),
        postId: Number(post_id),
      });

      io.emit("home_post_deleted", {
        postId: Number(post_id),
      });

      console.log(
        "ส่ง socket event การลบโพสสำเร็จ สนาม:",
        post.field_id,
        "โพส:",
        post_id
      );
    } else {
      console.log("ไม่พบ io socket connection สำหรับการลบโพส");
    }

    await invalidateCache(`posts:field:${post.field_id}`);
    await invalidatePattern("posts:latest:*");
    await invalidatePattern("posts:following:*");
    res.status(200).json({ message: "Post deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Delete failed" });
  }
});

module.exports = router;
