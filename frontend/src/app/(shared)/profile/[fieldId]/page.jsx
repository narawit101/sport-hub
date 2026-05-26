import React, { Suspense } from "react";
import FieldProfileClient from "@/components/field/FieldProfileClient";

export async function generateMetadata({ params }) {
  const { fieldId } = await params;
  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/profile/${fieldId}`,
    );
    const data = await res.json();
    if (res.ok && data?.data) {
      const cleanDesc = data.data.field_description
        ? data.data.field_description
            .replace(/<[^>]*>/g, "")
            .trim()
            .substring(0, 150)
        : "";
      return {
        title: `${data.data.field_name} - Sport Hub`,
        description:
          cleanDesc ||
          `รายละเอียดของสนาม ${data.data.field_name} และทำการจองออนไลน์`,
      };
    }
  } catch (error) {
    console.error("Error generating metadata:", error);
  }
  return {
    title: "รายละเอียดสนาม - Sport Hub",
    description: "รายละเอียดของสนามและทำการจองออนไลน์",
  };
}

export default async function Page({ params }) {
  const { fieldId } = await params;
  return (
    <Suspense
      fallback={
        <div className="load">
          <span className="spinner"></span>
        </div>
      }
    >
      <FieldProfileClient fieldId={fieldId} />
    </Suspense>
  );
}
