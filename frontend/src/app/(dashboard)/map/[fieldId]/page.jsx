"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import LongdoMapPicker from "@/components/shared/LongdoMapPicker";
import "@/app/css/map-edit-field.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { useNotification } from "@/app/contexts/NotificationContext";
import apiClient from "@/lib/apiClient";
import { USER_STATUS } from "@/constants/status";

export default function Map() {
  const { user, isLoading } = useAuth();
  const { notify } = useNotification();
  const [selectedLocation, setSelectedLocation] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [mapLoaded, setMapLoaded] = useState(false);
  const { fieldId } = useParams();
  const router = useRouter();

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      router.replace("/login");
      return;
    }

    if (user?.status !== USER_STATUS.VERIFIED) {
      router.replace("/verification");
    }
  }, [user, isLoading, router]);

  const handleSaveLocation = async () => {
    if (!selectedLocation) {
      notify("กรุณาเลือกตำแหน่งบนแผนที่ก่อน", "error");
      return;
    }
    setIsUpdating(true);
    try {
      const result = await apiClient.put(
        `/field/edit-location/${fieldId}`,
        {
          gps_location: selectedLocation,
        }
      );

      if (result) {
        notify("บันทึกตำแหน่งสำเร็จ", "success");
        setTimeout(() => {
          router.back();
        }, 1000);
      }
    } catch (error) {
      console.error("Save location error:", error);
      notify(error.message || "เกิดข้อผิดพลาดในการเชื่อมต่อ", "error");
    } finally {
      setIsUpdating(false);
    }
  };

  console.log("Field ID from params:", fieldId);
  console.log("Selected location:", selectedLocation);

  return (
    <div className="map-page-container-map-edit">
      <h2 className="map-page-title-map-edit">เลือกตำแหน่งสนามที่จะแก้ไข</h2>

      <div className="map-container-map-edit">
        <LongdoMapPicker
          onLocationSelect={(location) => {
            setSelectedLocation(location);
            console.log("Selected location:", location);
          }}
          onMapReady={() => setMapLoaded(true)}
          initialLocation={selectedLocation || "13.736717,100.523186"}
        />
      </div>

      {selectedLocation && (
        <div className="selected-location-display-map-edit">
          <img
            width={20}
            height={20}
            src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1756972382/bxs--map_c0lmby.png"
            alt=""
          />
          พิกัดที่เลือก: {selectedLocation}
        </div>
      )}

      <div className="map-actions-container-map-edit">
        <button
          className="btn-save-location-map-edit"
          onClick={handleSaveLocation}
          disabled={!selectedLocation || isUpdating || !mapLoaded}
        >
          {isUpdating ? (
            <span className="dot-loading">
              <span className="dot one">●</span>
              <span className="dot two">●</span>
              <span className="dot three">●</span>
            </span>
          ) : (
            "บันทึกตำแหน่ง"
          )}
        </button>
        <button className="btn-cancel-map-edit" onClick={() => router.back()}>
          ยกเลิก
        </button>
      </div>
    </div>
  );
}
