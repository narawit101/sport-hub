"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import "@/app/css/booking-slot.css";
import { useAuth } from "@/app/contexts/AuthContext";
import { io } from "socket.io-client";
import { usePreventLeave } from "@/app/hooks/usePreventLeave";
import Calendar from "react-calendar";
import "@/app/css/calendar-styles.css";

export default function Booking() {
  const { subFieldId } = useParams();
  const API_URL = process.env.NEXT_PUBLIC_API_URL;

  const [openHours, setOpenHours] = useState("");
  const [closeHours, setCloseHours] = useState("");
  const [slots, setSlots] = useState([]);
  const [selectedSlots, setSelectedSlots] = useState([]);
  const [selectedSlotsArr, setSelectedSlotsArr] = useState([]);
  const [canBook, setCanBook] = useState(false);
  const [timeStart, setTimeStart] = useState("");
  const [timeEnd, setTimeEnd] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [totalHours, setTotalHours] = useState(0);
  const [price, setPrice] = useState(0);
  const [newPrice, setNewPrice] = useState(0);
  const [addOns, setAddOns] = useState([]);
  const [activity, setActivity] = useState("เล่นกีฬา");
  const [facilities, setFacilities] = useState([]);
  const [selectPrice, setSelectPrice] = useState("subFieldPrice");
  const [selectedFacilities, setSelectedFacilities] = useState([]);
  const [priceDeposit, setPriceDeposit] = useState(0);
  const [sumFac, setSumFac] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [payMethod, setPayMethod] = useState("");

  const router = useRouter();
  const [bookingDate, setBookingDate] = useState(null);
  const bookingDateFormatted = bookingDate
    ? bookingDate.toLocaleDateString("en-CA")
    : null;
  const [openDays, setOpenDays] = useState([]);
  const [showCalendar, setShowCalendar] = useState(false);

  const { user, isLoading } = useAuth();
  const [isBooked, setIsBooked] = useState(false);
  const [subFieldData, setSubFieldData] = useState([]);
  const [field_id, setFieldId] = useState(null);
  const [fieldName, setFieldName] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [showSummary, setShowSummary] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [bookTimeArr, setBookTimeArr] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, SetstartProcessLoad] = useState(false);
  const [facilityAvailability, setFacilityAvailability] = useState({});
  const summaryRef = useRef(null);
  const [serverTime, setServerTime] = useState(null);
  const serverOffsetRef = useRef(0);
  const tickRef = useRef(null);
  const socketRef = useRef(null);

  usePreventLeave(startProcessLoad);
  const searchParams = useSearchParams();
  const currentUrl = `/booking/${subFieldId}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const fetchServerTimeOnce = useCallback(async () => {
    try {
      const res = await fetch(`${API_URL}/booking/server-time`, {
        credentials: "include",
      });
      const data = await res.json();
      if (data?.timestamp) {
        const clientTs = Date.now();
        serverOffsetRef.current = Number(data.timestamp) - clientTs;
        setServerTime(new Date(clientTs + serverOffsetRef.current));
      }
    } catch (e) {
      console.error("fallback server-time failed:", e);
    }
  }, [API_URL]);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join_booking");
    });

    const onServerTime = (payload) => {
      const serverTs = Number(payload?.timestamp);
      if (!Number.isFinite(serverTs)) return;
      const clientTs = Date.now();
      serverOffsetRef.current = serverTs - clientTs;
      setServerTime(new Date(clientTs + serverOffsetRef.current));
    };
    socket.on("server_time", onServerTime);

    const fallback = setTimeout(() => {
      if (!serverTime) fetchServerTimeOnce();
    }, 1000);

    tickRef.current = setInterval(() => {
      setServerTime(new Date(Date.now() + serverOffsetRef.current));
    }, 1000);

    socket.on("connect_error", (err) =>
      console.error("socket connect_error:", err?.message)
    );

    return () => {
      try {
        socket.emit("leave_booking");
      } catch {}
      clearTimeout(fallback);
      clearInterval(tickRef.current);
      socket.off("server_time", onServerTime);
      socket.disconnect();
    };
  }, [API_URL, fetchServerTimeOnce]);

  useEffect(() => {
    if (isLoading) return;

    if (!user) {
      sessionStorage.setItem("login_message", "กรุณาเข้าสู่ระบบ");
      router.replace(`/login?redirect=${encodeURIComponent(currentUrl)}`);
      return;
    }

    if (user?.status !== "ตรวจสอบแล้ว") {
      router.replace("/verification");
    }
  }, [user, isLoading, router, bookingDate]);

  const fetchBookedSlots = useCallback(async () => {
    try {
      const bookingDateFormatted = new Date(bookingDate).toLocaleDateString(
        "en-CA"
      );
      const day = new Date(`${bookingDateFormatted}T00:00:00`);
      const today = new Date(day);
      today.setDate(day.getDate() + 1);
      const tomorrow = new Date(day);
      tomorrow.setDate(day.getDate() + 2);

      const start = today.toISOString().split("T")[0];
      const end = tomorrow.toISOString().split("T")[0];

      const res = await fetch(
        `${API_URL}/booking/booked-block/${subFieldId}/${start}/${end}`,
        {
          credentials: "include",
        }
      );
      const data = await res.json();

      if (!data.error) {
        const timeRangesWithStatus = data.data.flatMap((item) =>
          (item.selected_slots || []).map((time) => ({
            time,
            status: item.status,
          }))
        );

        const selectedSlotsFromAPI = timeRangesWithStatus.map(
          (item) => item.time
        );

        setBookTimeArr(timeRangesWithStatus);
        setSelectedSlotsArr(selectedSlotsFromAPI);
      } else {
        setMessage("ไม่สามารถดึงข้อมูลได้", data.message);
        setMessageType("error");
      }
    } catch (error) {
      setMessage("ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", error.message);
      setMessageType("error");
    } finally {
      setDataLoading(false);
    }
  }, [API_URL, subFieldId, bookingDate]);

  useEffect(() => {
    fetchBookedSlots();
  }, [fetchBookedSlots]);

  useEffect(() => {
    const socket = io(API_URL, {
      transports: ["websocket"],
      withCredentials: true,
    });

    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Socket connected:", socket.id);
    });

    socket.on("slot_booked", (data) => {
      console.log("slot_booked:", data);
      if (subFieldId && bookingDate) {
        fetchBookedSlots();
        fetchFacilityAvailability();
      }
    });

    socket.on("connect_error", (err) => {
      console.error("Socket error:", err.message);
    });

    return () => socket.disconnect();
  }, [API_URL, subFieldId, bookingDate, facilityAvailability]);

  useEffect(() => {
    if (isBooked) {
      fetchBookedSlots();
      setIsBooked(false);
    }
  }, [isBooked, fetchBookedSlots]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFieldId(sessionStorage.getItem("field_id"));
      setFieldName(sessionStorage.getItem("field_name"));
    }
  }, []);

  useEffect(() => {
    if (!field_id) {
      return;
    }
    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/field/field-fac/${field_id}`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();

        if (!data.error && data.data) {
          const fac = data.data.filter((f) => f.fac_price !== 0);
          setFacilities(fac);
        } else {
          setMessage("ไม่สามารถดึงข้อมูลได้", data.message);
          setMessageType("error");
        }
      } catch (error) {
        setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้", error);
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [field_id]);
  useEffect(() => {
    const daysNumbers = {
      Sun: 0,
      Mon: 1,
      Tue: 2,
      Wed: 3,
      Thu: 4,
      Fri: 5,
      Sat: 6,
    };

    const fetchData = async () => {
      try {
        const res = await fetch(`${API_URL}/field/field-data/${subFieldId}`, {
          headers: {
            "Content-Type": "application/json",
          },
          credentials: "include",
        });

        const data = await res.json();

        if (!data.error) {
          const fieldData = data.data[0];
          setOpenHours(fieldData.open_hours);
          setCloseHours(fieldData.close_hours);
          setPriceDeposit(fieldData.price_deposit);

          const mapDaysToNum = fieldData.open_days.map(
            (day) => daysNumbers[day]
          );
          setOpenDays(mapDaysToNum);

          const calculatedSlots = slotTimes(
            fieldData.open_hours,
            fieldData.close_hours,
            fieldData.slot_duration
          );
          setSlots(calculatedSlots);

          const subField = fieldData.sub_fields.find(
            (sf) => sf.sub_field_id == subFieldId
          );

          if (subField) {
            setAddOns(subField.add_ons);
            setPrice(subField.price);
            setNewPrice(subField.price);
            setSubFieldData(subField);
          } else {
            setMessage("ไม่พบ subField ตาม subFieldId");
            setMessageType("error");
          }
        } else {
          setMessage("ไม่พบข้อมูลวันเปิดสนาม");
          setMessageType("error");
        }
      } catch (error) {
        setMessage("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
        setMessageType("error");
      } finally {
        setDataLoading(false);
      }
    };

    fetchData();
  }, [subFieldId]);

  function slotTimes(openHours, closeHours, slot_duration) {
    const slots = [];
    const duration = Number(slot_duration) || 60;
    let [openHour, openMinute] = openHours.split(":").map(Number);
    let [closeHour, closeMinute] = closeHours.split(":").map(Number);

    if (openMinute > 0 && openMinute <= 30) {
      openMinute = 30;
    } else if (openMinute > 30) {
      openMinute = 0;
      openHour += 1;
    }

    if (closeMinute > 0 && closeMinute <= 30) {
      closeMinute = 0;
    } else if (closeMinute > 30) {
      closeMinute = 30;
    }

    const openDate = new Date(1970, 0, 1, openHour, openMinute);
    let closeDate = new Date(1970, 0, 1, closeHour, closeMinute);

    if (closeDate <= openDate) {
      closeDate.setDate(closeDate.getDate() + 1);
    }

    let currentTime = new Date(openDate);

    while (currentTime < closeDate) {
      const nextTime = new Date(currentTime);
      nextTime.setMinutes(currentTime.getMinutes() + duration);

      const slot = `${currentTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${currentTime
        .getMinutes()
        .toString()
        .padStart(2, "0")} - ${nextTime
        .getHours()
        .toString()
        .padStart(2, "0")}:${nextTime
        .getMinutes()
        .toString()
        .padStart(2, "0")}`;
      slots.push(slot);

      currentTime.setMinutes(currentTime.getMinutes() + duration);
    }

    return slots;
  }

  function getSlotStatus(slot) {
    console.log(bookTimeArr);
    const found = bookTimeArr.find((b) => b.time === slot);
    return found ? found.status : null;
  }

  function calculateSelectedTimes() {
    if (selectedSlots.length === 0) {
      setTimeStart("");
      setTimeEnd("");
      setStartDate(null);
      setEndDate(null);
      setTotalHours(0);
      return;
    }

    const sorted = [...selectedSlots].sort((a, b) => a - b);
    const start = slots[sorted[0]].split("-")[0].trim();
    let end = slots[sorted[sorted.length - 1]].split("-")[1].trim();

    const [startHour, startMinute] = start.split(":").map(Number);
    const [endHour, endMinute] = end.split(":").map(Number);
    const [openHour, openMinute] = openHours.split(":").map(Number);
    const bookingDateObj = new Date(bookingDateFormatted);
    const startDateObj = new Date(bookingDateObj);
    const endDateObj = new Date(bookingDateObj);

    if (
      startHour < openHour ||
      (startHour === openHour && startMinute < openMinute)
    ) {
      startDateObj.setDate(startDateObj.getDate() + 1);
      endDateObj.setDate(endDateObj.getDate() + 1);
    }

    if (
      endHour < startHour ||
      (endHour === startHour && endMinute < startMinute)
    ) {
      endDateObj.setDate(endDateObj.getDate() + 1);
    }

    setStartDate(startDateObj.toISOString().split("T")[0]);
    setEndDate(endDateObj.toISOString().split("T")[0]);
    setTimeStart(start);
    setTimeEnd(end);

    const startInMinutes = startHour * 60 + startMinute;
    const endInMinutes = endHour * 60 + endMinute;
    let minutes = endInMinutes - startInMinutes;

    if (minutes < 0) minutes += 24 * 60;
    let hours = minutes / 60;

    setTotalHours(hours);
  }

  const formatTotalHours = (totalHours) => {
    if (totalHours === 0.5) {
      return "30 นาที";
    } else if (totalHours % 1 === 0.5) {
      return `${Math.floor(totalHours)} ชั่วโมง 30 นาที`;
    } else {
      return `${totalHours} ชั่วโมง`;
    }
  };

  useEffect(() => {
    calculateSelectedTimes();
  }, [selectedSlots]);

  const handlePriceOnChange = (e) => {
    const selectedValue = e.target.value;
    setSelectPrice(selectedValue);

    console.log("Selected Value:", selectedValue);
    if (selectedValue === "subFieldPrice") {
      setNewPrice(price);
      console.log("subField price:", price);
      setActivity(subFieldData.sport_name);
    } else {
      const selectedAddOn = addOns.find(
        (addOn) => addOn.add_on_id === parseInt(selectedValue)
      );
      console.log("Available AddOns:", addOns);

      if (selectedAddOn) {
        setNewPrice(selectedAddOn.price);
        console.log("Add-On price:", selectedAddOn.price);
        setActivity(selectedAddOn.content);
      } else {
        console.log("Add-On not found for selected value:", selectedValue);
      }
    }
  };

  const handleFacilitySelect = (facId, facPrice, facName) => {
    setSelectedFacilities((prev) => {
      if (prev[facId] !== undefined) {
        const updatedFacilities = { ...prev };
        delete updatedFacilities[facId];

        let newSumFac = 0;
        Object.values(updatedFacilities).forEach((item) => {
          newSumFac += item.price * item.quantity;
        });
        setSumFac(newSumFac);

        const sum = newPrice * totalHours + newSumFac;
        const remaining = sum - priceDeposit;
        setTotalPrice(sum);
        setTotalRemaining(remaining);

        return updatedFacilities;
      }

      const updatedFacilities = {
        ...prev,
        [facId]: {
          field_fac_id: facId,
          fac_name: facName,
          price: facPrice,
          quantity: 1,
        },
      };

      let newSumFac = 0;
      Object.values(updatedFacilities).forEach((item) => {
        newSumFac += item.price * item.quantity;
      });
      setSumFac(newSumFac);

      const sum = newPrice * totalHours + newSumFac;
      const remaining = sum - priceDeposit;
      setTotalPrice(sum);
      setTotalRemaining(remaining);

      return updatedFacilities;
    });
  };

  const calculatePrice = (newPrice, totalHours, sumFac) => {
    if (sumFac === 0) {
      if (totalHours % 1 === 0.3) {
        totalHours = totalHours + 0.2;
      }
      const sum = newPrice * totalHours;
      const remaining = newPrice * totalHours - priceDeposit;
      setTotalPrice(sum);
      setTotalRemaining(remaining);
    } else {
      const sum = newPrice * totalHours + sumFac;
      const remaining = newPrice * totalHours + sumFac - priceDeposit;
      setTotalPrice(sum);
      setTotalRemaining(remaining);
    }
    return totalPrice;
  };

  const handleRadioChange = (e) => {
    setPayMethod(e.target.value);
  };

  function isPastSlot(slot) {
    if (!serverTime) return false;
    const [startTime] = slot.split(" - ");
    const [h, m] = startTime.split(":").map(Number);

    const bookingDateObj = new Date(bookingDateFormatted);
    const slotDateTime = new Date(bookingDateObj);
    slotDateTime.setHours(h, m, 0, 0);

    if (openHours && closeHours) {
      const [oh] = openHours.split(":").map(Number);
      const [ch] = closeHours.split(":").map(Number);
      if (ch < oh && h < oh) slotDateTime.setDate(slotDateTime.getDate() + 1);
    }

    const isSameDay =
      serverTime.toLocaleDateString("en-CA") ===
      bookingDateObj.toLocaleDateString("en-CA");

    if (!isSameDay) return false;
    return serverTime > slotDateTime;
  }

  function resetSelection() {
    setStartDate("");
    setEndDate("");
    setCanBook(false);
    setSelectedSlots([]);
    setPayMethod("");
    setSelectedFacilities([]);
    setTimeStart("");
    setTimeEnd("");
    setTotalHours(0);
    setTotalPrice(0);
    setTotalRemaining(0);
    setSumFac(0);
    setShowSummary(false);
  }

  const handleConfirm = () => {
    if (totalPrice > 0) {
      if (!payMethod) {
        setMessage("กรุณาเลือกช่องทางการชำระเงิน");
        setMessageType("error");
        return;
      }
    }
    handleSubmit();
  };

  const handleDateChange = (newDate) => {
    if (bookingDate && newDate.toDateString() === bookingDate.toDateString()) {
      setBookingDate(null);
    } else {
      setBookingDate(newDate);
      setMessage("");
      fetchBookedSlots();
      setSelectedSlotsArr([]);
      resetSelection();
    }
  };

  const today = serverTime || new Date();

  const maxDate = serverTime ? new Date(serverTime.getTime()) : undefined;
  if (maxDate) maxDate.setDate(maxDate.getDate() + 60);

  const tileClassName = ({ date, view }) => {
    const day = date.getDay();
    if (
      view === "month" &&
      openDays.includes(day) &&
      date <= maxDate &&
      date >= today
    ) {
      return "allowed-day";
    }
    return "";
  };

  const handleCancel = () => {
    setShowSummary(false);
    setPayMethod("");
    setSelectedFacilities([]);
    setSumFac(0);
    resetSelection();
  };

  const fetchFacilityAvailability = async () => {
    if (!field_id || !bookingDateFormatted || selectedSlotsArr.length === 0)
      return;
    const slotsParam = encodeURIComponent(selectedSlotsArr.join(","));
    const res = await fetch(
      `${API_URL}/facilities/availability/${field_id}/${bookingDateFormatted}/${slotsParam}`,
      { credentials: "include" }
    );

    const data = await res.json();
    console.log("Facility availability response:", data);
    if (res.ok) {
      const map = {};
      data.forEach((item) => {
        map[item.field_fac_id] = item.available;
      });
      setFacilityAvailability(map);
      console.log("Facility availability fetched:", map);
    }
  };

  useEffect(() => {
    if (field_id && bookingDateFormatted && selectedSlotsArr.length > 0) {
      fetchFacilityAvailability();
    }
  }, [field_id, bookingDateFormatted, selectedSlotsArr]);

  const validateBeforeSubmit = () => {
    if (!timeStart || !timeEnd) {
      fetchFacilityAvailability();
      console.log("Facility availability fetched:", facilityAvailability);
      setMessage("กรุณาเลือกช่วงเวลา");
      setMessageType("error");
      return;
    }

    setShowSummary(true);
    setTimeout(() => {
      summaryRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }, 120);
  };

  const handleSubmit = async () => {
    const bookingData = new FormData();
    SetstartProcessLoad(true);
    const facilityList = Object.values(selectedFacilities).map((item) => ({
      field_fac_id: item.field_fac_id,
      fac_name: item.fac_name,
      quantity: item.quantity,
    }));

    bookingData.append(
      "data",
      JSON.stringify({
        fieldId: field_id,
        userId: user?.user_id,
        subFieldId: subFieldId,
        bookingDate: bookingDateFormatted,
        startTime: timeStart,
        startDate: startDate,
        endTime: timeEnd,
        endDate: endDate,
        selectedSlots: selectedSlotsArr,
        totalHours: totalHours,
        totalPrice: totalPrice,
        payMethod: payMethod,
        totalRemaining: totalRemaining,
        activity: activity,
        selectedFacilities: facilityList,
        status: "pending",
      })
    );

    console.log("Booking Data being sent:", bookingData);

    try {
      const response = await fetch(`${API_URL}/booking`, {
        method: "POST",
        credentials: "include",
        body: bookingData,
      });
      const data = await response.json();

      if (response.status === 429 && data.code === "RATE_LIMIT") {
        router.push("/api-rate-limited");
        return;
      }
      if (response.ok) {
        setMessage("บันทึกการจองสำเร็จ");
        setMessageType("success");
        setShowSummary(false);
        setStartDate("");
        setEndDate("");
        setIsBooked(true);
        setCanBook(false);
        setSelectedSlots([]);
        setPayMethod("");
        setSelectedFacilities([]);
        setTimeStart("");
        setTimeEnd("");
        setTotalHours(0);
        setTotalPrice(0);
        setTotalRemaining(0);
        setSumFac(0);
      } else {
        setMessage(data.message);
        setMessageType("error");
        setShowSummary(false);
        setStartDate("");
        setEndDate("");
        setCanBook(false);
        setSelectedSlots([]);
        setPayMethod("");
        setSelectedFacilities([]);
        setTimeStart("");
        setTimeEnd("");
        setTotalHours(0);
        setTotalPrice(0);
        setTotalRemaining(0);
        setSumFac(0);
      }
    } catch (error) {
      setMessage(`ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้`);
      setMessageType("error");
    } finally {
      SetstartProcessLoad(false);
    }
  };

  useEffect(() => {
    console.log("คิดเงิน");
    console.log(newPrice);
    console.log(totalHours);
    console.log(sumFac);

    if (newPrice && totalHours) {
      calculatePrice(newPrice, totalHours, sumFac);
    }
  }, [newPrice, totalHours, sumFac]);

  function toggleSelectSlot(index) {
    if (showSummary) {
      setShowSummary(false);
    }

    if (selectedSlots.length === 0) {
      const newIndexes = [index];
      const newSlotArr = [slots[index]];
      setSelectedSlots(newIndexes);
      setSelectedSlotsArr(newSlotArr);
      setCanBook(true);
    } else if (selectedSlots.length === 1) {
      const range = [selectedSlots[0], index].sort((a, b) => a - b);
      const allIndexes = [];
      const allSlots = [];
      for (let i = range[0]; i <= range[1]; i++) {
        allIndexes.push(i);
        allSlots.push(slots[i]);
      }
      setSelectedSlots(allIndexes);
      setSelectedSlotsArr(allSlots);
      setCanBook(true);
    } else {
      const newIndexes = [index];
      const newSlotArr = [slots[index]];
      setSelectedSlots(newIndexes);
      setSelectedSlotsArr(newSlotArr);
      setCanBook(true);
    }
  }

  const formatDateToThai = (date) => {
    if (!date) return "";

    const parsedDate = new Date(date);
    if (isNaN(parsedDate)) return "ไม่สามารถแปลงวันที่ได้";

    const options = { day: "numeric", month: "long", year: "numeric" };
    return new Intl.DateTimeFormat("th-TH", options).format(parsedDate);
  };

  const formatPrice = (value) => new Intl.NumberFormat("th-TH").format(value);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        setMessage("");
        setMessageType("");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [message]);
  console.log(selectedSlotsArr);

  if (dataLoading)
    return (
      <div className="load">
        <span className="spinner"></span>
      </div>
    );

  return (
    <div>
      {message && (
        <div className={`message-box ${messageType}`}>
          <p>{message}</p>
        </div>
      )}

      <div className="container-bookings">
        {slots.length === 0 ? (
          <div>
            {" "}
            {dataLoading && (
              <div className="loading-data">
                <div className="loading-data-spinner"></div>
              </div>
            )}
          </div>
        ) : (
          <div className="book-content">
            {showCalendar && (
              <div
                className="calendar-popup-overlay"
                onClick={() => setShowCalendar(false)}
              >
                <div
                  className="calendar-popup"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Calendar
                    onChange={(newDate) => {
                      handleDateChange(newDate);
                      setShowCalendar(false);
                    }}
                    value={bookingDate}
                    showNeighboringMonth={false}
                    minDate={today}
                    maxDate={maxDate}
                    tileClassName={tileClassName}
                    tileDisabled={({ date, view }) => {
                      const day = date.getDay();
                      return view === "month" && !openDays.includes(day);
                    }}
                  />
                </div>
              </div>
            )}

            {/* <hr className="divider-order-select-date" /> */}
            <div className="calendar-btn-select-date">
              <div className="date-picker-container">
                <div className="date-select-label">
                  <h2>เลือกวันที่: </h2>
                </div>

                <button
                  className="calendar-toggle-btn"
                  onClick={() => setShowCalendar(!showCalendar)}
                >
                  {bookingDate ? (
                    formatDateToThai(bookingDate)
                  ) : (
                    <>
                      <img
                        src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAAAXNSR0IArs4c6QAAAUZJREFUSEvNVYFxwjAMfG1SJilMAkxSOgndBDpJYZJv3ycFJyF2Am6vvgMOR9G/9PLb8MvLpvKTfDGzSw2/FlcCOAIQyKYEQrIYNwIguVNiAG8AVEGtirXHnAF8mtlHTqgDIKnAxCZLWkseufSOPlp6ZxPtzQG+POB9yKKmQzyXHgBO+m9mq/SrL2+L2AtZpT68HERkU64AUPKdmU2KvgSRJH/IqxOHHCDEWpJrKla5zprAAFDf0maL7DEoQwAJU5z5ueAkQ+heBX8L4Cx0ktO4+bSJ2dy9RDjXoFfBPQtYsPcPWjRX0Htxs0RurYFO8nog6MiGF2ggq9BB24fIBwDbHODJFo0AdIqlfAuz032i6vdy5aigs1l/8JBluJNGa2927YcoQFpcOGKfSPbs2RmoXa+uQdxSNUl0i139opGe3Wri/yX0b2jJ5Bkv0yj2AAAAAElFTkSuQmCC"
                        alt=""
                      />
                    </>
                  )}
                </button>
                {bookingDate && (
                  <button
                    className="btn-cancel-select-date"
                    onClick={() => {
                      setBookingDate(null);
                      setShowSummary(false);
                      resetSelection();
                    }}
                  >
                    X
                  </button>
                )}
              </div>
            </div>
            <hr className="divider-order-select-date" />

            <div className="sum-status-box-book">
              <div className="status-item-book">
                <div className="status-box-book-1"></div>
                <label>ว่าง</label>
              </div>
              <div className="status-item-book">
                <div className="status-box-book-2"></div>
                <label>รอตรวจสอบ</label>
              </div>
              <div className="status-item-book">
                <div className="status-box-book-3"></div>
                <label>จองแล้ว</label>
              </div>
            </div>
            <div className="slots-grid-book">
              {slots.map((slot, index) => {
                const minIndex = Math.min(...selectedSlots);
                const maxIndex = Math.max(...selectedSlots);
                const isSelected =
                  selectedSlots.length > 0 &&
                  index >= minIndex &&
                  index <= maxIndex;

                const slotStatus = getSlotStatus(slot);
                const isBooked = slotStatus !== null;
                const isPast = isPastSlot(slot);

                let slotClass = "slot-box-book";
                if (isPast) slotClass += " past-slot";
                else if (slotStatus === "approved")
                  slotClass += " approved-slot";
                else if (slotStatus === "complete")
                  slotClass += " complete-slot";
                else if (slotStatus === "pending") slotClass += " pending-slot";
                else if (slotStatus === "verified")
                  slotClass += " complete-slot";
                else if (isSelected) slotClass += " selected-slot";

                return (
                  <div
                    key={index}
                    className={slotClass}
                    onClick={() => {
                      if (!isBooked && !isPast) {
                        if (!bookingDate) {
                          setMessage("กรุณาเลือกวันที่ก่อน");
                          setMessageType("error");
                        } else {
                          toggleSelectSlot(index);
                        }
                      }
                    }}
                    style={{
                      cursor:
                        isBooked || isPast || !bookingDate
                          ? "not-allowed"
                          : "pointer",
                      opacity: isPast || !bookingDate ? 0.6 : 1,
                    }}
                  >
                    <div className="slot-time-book">{slot}</div>
                    <div className="slot-tag-book">
                      {isPast ? (
                        <img
                          src="https://res.cloudinary.com/dlwfuul9o/image/upload/v1755181987/lsicon--overtime-outline_tywsty.png"
                          width={20}
                          height={20}
                          style={{ marginTop: "5px" }}
                          alt="Past Slot"
                        />
                      ) : slotStatus === "approved" ? (
                        ""
                      ) : slotStatus === "pending" ? (
                        ""
                      ) : isSelected ? (
                        "กำลังเลือก"
                      ) : (
                        ""
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="addon-options-book">
              <div className="addon-grid-book">
                <div
                  className={`addon-card ${
                    selectPrice === "subFieldPrice" ? "selected" : ""
                  }`}
                  onClick={() =>
                    handlePriceOnChange({ target: { value: "subFieldPrice" } })
                  }
                >
                  <p className="addon-content-book">เล่นกีฬา</p>
                  <p className="addon-price-book">
                    {formatPrice(price)} บาท/ชม.
                  </p>
                </div>

                {addOns.map((addOn) => (
                  <div
                    key={addOn.add_on_id}
                    className={`addon-card ${
                      selectPrice === addOn.add_on_id ? "selected" : ""
                    }`}
                    onClick={() =>
                      handlePriceOnChange({
                        target: { value: addOn.add_on_id },
                      })
                    }
                  >
                    <p className="addon-content-book">{addOn.content}</p>
                    <p className="addon-price-book">
                      {formatPrice(addOn.price)} บาท/ชม.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        <div className="book-sider">
          <div className="book-sum-box">
            <h1 className="field-title-book">{fieldName}</h1>
            {subFieldData !== "ไม่พบข้อมูล" ? (
              <h2 className="sub-field-title">
                สนาม: {subFieldData.sub_field_name}
              </h2>
            ) : (
              <h2 className="sub-field-title sub-field-error">
                สนาม: {subFieldData}
              </h2>
            )}

            {/* <div className="local-time-info">
              <small>
                เวลาปัจจุบัน:{" "}
                {serverTime
                  ? serverTime.toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })
                  : new Date().toLocaleTimeString("th-TH", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                    })}{" "}
                GMT+7
              </small>
            </div> */}

            <div className="time-info">
              <p>
                วันที่:{" "}
                {bookingDate
                  ? formatDateToThai(bookingDate)
                  : "ยังไม่ได้เลือกวันที่"}
              </p>
            </div>
            <div className="time-info">
              เปิด: {openHours} - {closeHours} น
            </div>

            <div className="time-info-book">
              <strong>เวลาเริ่ม: {timeStart || "-"}</strong>
              <strong>เวลาสิ้นสุด: {timeEnd || "-"}</strong>
              <strong>
                รวมเวลา: {totalHours ? formatTotalHours(totalHours) : "-"}
              </strong>
            </div>

            {canBook && bookingDate && (
              <>
                <button
                  onClick={validateBeforeSubmit}
                  className="btn-submit-book"
                >
                  จอง
                </button>
                <button className="btn-reset" onClick={resetSelection}>
                  รีเซ็ตการเลือก
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Summary Section - replaces modal */}
      {showSummary && (
        <div ref={summaryRef} className="booking-summary-section">
          <div className="booking-summary-container">
            <h1 className="summary-header">สรุปการจอง</h1>
            <hr className="divider-order-select-date" />

            <div className="summary-details">
              <h2 className="field-title-summary">{fieldName}</h2>
              {subFieldData !== "ไม่พบข้อมูล" ? (
                <h3 className="sub-field-title-summary">
                  สนาม: {subFieldData.sub_field_name}
                </h3>
              ) : (
                <h3 className="sub-field-title-summary sub-field-error">
                  สนาม: {subFieldData}
                </h3>
              )}

              <div className="time-summary-info">
                <div className="summary-row">
                  <strong>วันที่:</strong>
                  <span>{formatDateToThai(bookingDate)}</span>
                </div>
                <div className="summary-row">
                  <strong>เวลาเริ่ม:</strong>
                  <span>{timeStart}</span>
                </div>
                <div className="summary-row">
                  <strong>เวลาสิ้นสุด:</strong>
                  <span>{timeEnd}</span>
                </div>
                <div className="summary-row">
                  <strong>รวมเวลา:</strong>
                  <span>{formatTotalHours(totalHours)}</span>
                </div>
                <div className="summary-row">
                  <strong>ประเภทการจอง:</strong>
                  <span>{activity}</span>
                </div>
              </div>

              {facilities.length > 0 && (
                <div className="facilities-summary-section">
                  <h4>สิ่งอำนวยความสะดวก</h4>

                  <div className="facilities-carousel-container">
                    <div className="facilities-carousel">
                      {facilities.map((fac) => {
                        const isSelected =
                          selectedFacilities[fac.field_fac_id] !== undefined;
                        const availableQty =
                          facilityAvailability[fac.field_fac_id] ||
                          fac.quantity_total;
                        const selectedQty =
                          selectedFacilities[fac.field_fac_id]?.quantity || 0;

                        return (
                          <div
                            key={fac.field_fac_id}
                            className={`facility-card-summary ${
                              isSelected ? "selected" : ""
                            }`}
                          >
                            <div className="facility-image-container">
                              {fac.image_path ? (
                                <img
                                  src={fac.image_path}
                                  alt={fac.fac_name}
                                  className="facility-image"
                                  onError={(e) => {
                                    e.target.style.display = "none";
                                    e.target.nextSibling.style.display = "flex";
                                  }}
                                />
                              ) : null}
                              <div
                                className="facility-no-image"
                                style={{
                                  display: fac.image_path ? "none" : "flex",
                                }}
                              >
                                <span>ไม่มีรูปภาพ</span>
                              </div>
                            </div>

                            <div className="facility-info-summary">
                              <h5 className="facility-name">{fac.fac_name}</h5>
                              <p className="facility-price">
                                ราคา: {formatPrice(fac.fac_price)} บาท
                              </p>
                              <p className="facility-availability">
                                เหลือ {availableQty} จาก {fac.quantity_total}{" "}
                              </p>
                              <p className="facility-availability">
                                รายละเอียด: {fac.description}{" "}
                              </p>

                              <div className="facility-controls">
                                <button
                                  type="button"
                                  className={`facility-select-btn ${
                                    isSelected ? "selected" : ""
                                  }`}
                                  onClick={() =>
                                    handleFacilitySelect(
                                      fac.field_fac_id,
                                      fac.fac_price,
                                      fac.fac_name
                                    )
                                  }
                                >
                                  {isSelected ? "ยกเลิกเลือก" : "เลือก"}
                                </button>

                                {isSelected && (
                                  <div className="quantity-control">
                                    <label>จำนวน:</label>
                                    <input
                                      type="number"
                                      min={1}
                                      max={availableQty}
                                      value={selectedQty}
                                      onChange={(e) => {
                                        const value = Math.max(
                                          1,
                                          Math.min(
                                            availableQty,
                                            Number(e.target.value)
                                          )
                                        );
                                        setSelectedFacilities((prev) => {
                                          const updated = {
                                            ...prev,
                                            [fac.field_fac_id]: {
                                              ...prev[fac.field_fac_id],
                                              quantity: value,
                                            },
                                          };

                                          let newSumFac = 0;
                                          Object.values(updated).forEach(
                                            (item) => {
                                              newSumFac +=
                                                item.price * item.quantity;
                                            }
                                          );
                                          setSumFac(newSumFac);

                                          const sum =
                                            newPrice * totalHours + newSumFac;
                                          const remaining = sum - priceDeposit;
                                          setTotalPrice(sum);
                                          setTotalRemaining(remaining);

                                          return updated;
                                        });
                                      }}
                                      className="quantity-input"
                                    />
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Selected Facilities Summary */}
                  {Object.keys(selectedFacilities).length > 0 && (
                    <div className="selected-facilities-summary">
                      <h5>สิ่งอำนวยความสะดวกที่เลือก:</h5>
                      {Object.values(selectedFacilities).map((fac) => (
                        <div
                          key={fac.field_fac_id}
                          className="selected-facility-item"
                        >
                          <span>{fac.fac_name}</span>
                          <span>จำนวน: {fac.quantity}</span>
                          <span>
                            {formatPrice(fac.price * fac.quantity)} บาท
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="price-summary-section">
                <div className="price-breakdown">
                  <div className="price-row">
                    <span>ราคาสนาม ({formatTotalHours(totalHours)}):</span>
                    <span>{formatPrice(newPrice * totalHours)} บาท</span>
                  </div>

                  {sumFac > 0 && (
                    <div className="price-row">
                      <span>สิ่งอำนวยความสะดวก:</span>
                      <span>{formatPrice(sumFac)} บาท</span>
                    </div>
                  )}

                  <div className="price-row deposit-row">
                    <span>มัดจำที่ต้องจ่าย:</span>
                    <span>{formatPrice(priceDeposit)} บาท</span>
                  </div>

                  <div className="price-row remaining-row">
                    <span>
                      <strong>คงเหลือที่ต้องจ่าย:</strong>
                    </span>
                    <span>
                      <strong>{formatPrice(totalRemaining)} บาท</strong>
                    </span>
                  </div>
                  <div className="price-row total-row">
                    <span>
                      <strong>รวมทั้งหมด:</strong>
                    </span>
                    <span>
                      <strong>{formatPrice(totalPrice)} บาท</strong>
                    </span>
                  </div>
                </div>
                {totalPrice > 0 && (
                  <div className="payment-method-section">
                    <h5>วิธีการชำระเงิน:</h5>
                    <div className="payment-options">
                      <label className="payment-option">
                        <input
                          type="radio"
                          value="โอนจ่าย"
                          checked={payMethod === "โอนจ่าย"}
                          onChange={handleRadioChange}
                        />
                        <span>โอนผ่านธนาคาร</span>
                      </label>
                      <label className="payment-option">
                        <input
                          type="radio"
                          value="เงินสด"
                          checked={payMethod === "เงินสด"}
                          onChange={handleRadioChange}
                        />
                        <span>เงินสดหน้าสนาม</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>
              <div className="summary-actions">
                <button
                  onClick={handleConfirm}
                  disabled={startProcessLoad}
                  className="btn-confirm-booking"
                >
                  {startProcessLoad ? (
                    <span className="dot-loading">
                      <span className="dot one">●</span>
                      <span className="dot two">●</span>
                      <span className="dot three">●</span>
                    </span>
                  ) : (
                    "ยืนยันการจอง"
                  )}
                </button>

                <button
                  onClick={handleCancel}
                  disabled={startProcessLoad}
                  className="btn-cancel-booking"
                >
                  ยกเลิก
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
