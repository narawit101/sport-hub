import React from "react";
import { Editor } from "@tinymce/tinymce-react";

export default function VenueDescription({ fieldData, handleEditorChange }) {
  return (
    <div className="input-group-register-field">
      <div className="icon-label-container">
        <label>คำแนะนำของสนาม</label>
        <img
          width={20}
          height={20}
          style={{ verticalAlign: "middle" }}
          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1757261993/streamline-plump--description-solid_ct73qk.png"
          alt=""
        />
      </div>
      <div className="tinymce-editor">
        <Editor
          apiKey={process.env.NEXT_PUBLIC_TINYMCE_KEY}
          value={fieldData.field_description}
          onEditorChange={handleEditorChange}
          init={{
            height: 350,
            menubar: false,
            plugins: [
              "advlist",
              "autolink",
              "lists",
              "link",
              "charmap",
              "anchor",
              "searchreplace",
              "visualblocks",
              "code",
              "fullscreen",
              "insertdatetime",
              "media",
              "table",
              "code",
              "help",
              "wordcount",
            ],
            toolbar:
              "undo redo | formatselect | " +
              "bold italic backcolor | alignleft aligncenter " +
              "alignright alignjustify | bullist numlist outdent indent | " +
              "removeformat | help",
            content_style:
              "body { font-family:Helvetica,Arial,sans-serif; font-size:14px }",
          }}
        />
      </div>
    </div>
  );
}
