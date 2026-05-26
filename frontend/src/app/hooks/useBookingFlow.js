import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSocket } from "@/app/contexts/SocketContext";
import apiClient from "@/lib/apiClient";
import { USER_STATUS, BOOKING_STATUS } from "@/constants/status";

export function useBookingFlow(subFieldId, user, notify) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const socket = useSocket();
  const currentUrl = `/booking/${subFieldId}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`;

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
  const [selectedFacilities, setSelectedFacilities] = useState({});
  const [priceDeposit, setPriceDeposit] = useState(0);
  const [sumFac, setSumFac] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);
  const [totalRemaining, setTotalRemaining] = useState(0);
  const [payMethod, setPayMethod] = useState("");
  const [bookingDate, setBookingDate] = useState(null);
  const [openDays, setOpenDays] = useState([]);
  const [isBooked, setIsBooked] = useState(false);
  const [subFieldData, setSubFieldData] = useState([]);
  const [fieldId, setFieldId] = useState(null);
  const [fieldName, setFieldName] = useState("");
  const [showSummary, setShowSummary] = useState(false);
  const [bookTimeArr, setBookTimeArr] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [startProcessLoad, setStartProcessLoad] = useState(false);
  const [facilityAvailability, setFacilityAvailability] = useState({});
  const [serverTime, setServerTime] = useState(null);
  const serverOffsetRef = useRef(0);
  const tickRef = useRef(null);

  const loadedRef = useRef(false);
  const bookingDateFormatted = bookingDate ? bookingDate.toLocaleDateString("en-CA") : null;

  useEffect(() => {
    setBookingDate(new Date());
  }, []);

  const fetchServerTimeOnce = useCallback(async () => {
    try {
      const data = await apiClient.get("/booking/server-time");
      if (data?.timestamp) {
        const clientTs = Date.now();
        serverOffsetRef.current = Number(data.timestamp) - clientTs;
        setServerTime(new Date(clientTs + serverOffsetRef.current));
        loadedRef.current = true;
      }
    } catch (e) {
      console.error("fallback server-time failed:", e);
    }
  }, []);

  useEffect(() => {
    tickRef.current = setInterval(() => {
      setServerTime(new Date(Date.now() + serverOffsetRef.current));
    }, 1000);
    const fallback = setTimeout(() => {
      if (!loadedRef.current) fetchServerTimeOnce();
    }, 1000);

    return () => {
      clearTimeout(fallback);
      clearInterval(tickRef.current);
    };
  }, [fetchServerTimeOnce]);

  const fetchBookedSlots = useCallback(async () => {
    if (!bookingDateFormatted) return;
    try {
      const start = bookingDateFormatted;
      const [year, month, day] = start.split("-").map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      date.setUTCDate(date.getUTCDate() + 1);
      const end = date.toISOString().split("T")[0];

      const data = await apiClient.get(`/booking/booked-block/${subFieldId}/${start}/${end}`);

      if (!data.error) {
        const timeRangesWithStatus = data.data.flatMap((item) =>
          (item.selected_slots || []).map((time) => ({ time, status: item.status }))
        );
        setBookTimeArr(timeRangesWithStatus);
      }
    } catch (error) {
      notify(error.message || "ไม่สามารถเชือมต่อกับเซิร์ฟเวอร์ได้", "error");
    } finally {
      setDataLoading(false);
    }
  }, [subFieldId, bookingDateFormatted, notify]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("join_booking");

    const onServerTime = (payload) => {
      const serverTs = Number(payload?.timestamp);
      if (!Number.isFinite(serverTs)) return;
      const clientTs = Date.now();
      serverOffsetRef.current = serverTs - clientTs;
      setServerTime(new Date(clientTs + serverOffsetRef.current));
      loadedRef.current = true;
    };
    socket.on("server_time", onServerTime);

    const handleSlotBooked = (data) => {
      if (String(data.subFieldId) === String(subFieldId)) {
        console.log("Slot booked elsewhere, reloading slots...");
        fetchBookedSlots();
      }
    };
    socket.on("slot_booked", handleSlotBooked);

    return () => {
      try { socket.emit("leave_booking"); } catch {}
      socket.off("server_time", onServerTime);
      socket.off("slot_booked", handleSlotBooked);
    };
  }, [socket, subFieldId, fetchBookedSlots]);

  useEffect(() => { fetchBookedSlots(); }, [fetchBookedSlots]);

  const fetchFieldData = useCallback(async () => {
    try {
      const data = await apiClient.get(`/field/field-data/${subFieldId}`);
      if (!data.error) {
        const fData = data.data[0];
        setOpenHours(fData.open_hours);
        setCloseHours(fData.close_hours);
        setPriceDeposit(fData.price_deposit);
        const daysNumbers = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
        setOpenDays(fData.open_days.map(d => daysNumbers[d]));
        setSlots(slotTimes(fData.open_hours, fData.close_hours, fData.slot_duration));
        const subField = fData.sub_fields.find(sf => sf.sub_field_id == subFieldId);
        if (subField) {
          setAddOns(subField.add_ons);
          setPrice(subField.price);
          setNewPrice(subField.price);
          setSubFieldData(subField);
          setActivity(subField.sport_name);
        }
      }
    } catch (error) {
      notify(error.message || "ไม่สามารถโหลดข้อมูลสนามได้", "error");
    }
  }, [subFieldId, notify]);

  useEffect(() => { fetchFieldData(); }, [fetchFieldData]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setFieldId(sessionStorage.getItem("field_id"));
      setFieldName(sessionStorage.getItem("field_name"));
    }
  }, []);

  const fetchFacilities = useCallback(async () => {
    if (!fieldId) return;
    try {
      const data = await apiClient.get(`/field/field-fac/${fieldId}`);
      if (!data.error && data.data) {
        setFacilities(data.data.filter(f => f.fac_price !== 0));
      }
    } catch (error) {
      console.error(error);
    }
  }, [fieldId]);

  useEffect(() => { fetchFacilities(); }, [fetchFacilities]);

  const fetchFacilityAvailability = useCallback(async () => {
    if (!fieldId || !bookingDateFormatted || selectedSlotsArr.length === 0) return;
    const slotsParam = encodeURIComponent(selectedSlotsArr.join(","));
    try {
      const data = await apiClient.get(`/facilities/availability/${fieldId}/${bookingDateFormatted}/${slotsParam}`);
      const map = {};
      data.forEach(item => { map[item.field_fac_id] = item.available; });
      setFacilityAvailability(map);
    } catch (error) {
      console.error(error);
    }
  }, [fieldId, bookingDateFormatted, selectedSlotsArr]);

  useEffect(() => { fetchFacilityAvailability(); }, [fetchFacilityAvailability]);

  function slotTimes(open, close, duration) {
    const slots = [];
    const dur = Number(duration) || 60;
    let [oh, om] = open.split(":").map(Number);
    let [ch, cm] = close.split(":").map(Number);
    if (om > 0 && om <= 30) om = 30; else if (om > 30) { om = 0; oh += 1; }
    if (cm > 0 && cm <= 30) cm = 0; else if (cm > 30) cm = 30;
    const oDate = new Date(1970, 0, 1, oh, om);
    let cDate = new Date(1970, 0, 1, ch, cm);
    if (cDate <= oDate) cDate.setDate(cDate.getDate() + 1);
    let curr = new Date(oDate);
    while (curr < cDate) {
      const next = new Date(curr); next.setMinutes(curr.getMinutes() + dur);
      slots.push(`${curr.getHours().toString().padStart(2, "0")}:${curr.getMinutes().toString().padStart(2, "0")} - ${next.getHours().toString().padStart(2, "0")}:${next.getMinutes().toString().padStart(2, "0")}`);
      curr.setMinutes(curr.getMinutes() + dur);
    }
    return slots;
  }

  const calculateSelectedTimes = useCallback(() => {
    if (selectedSlots.length === 0) {
      setTimeStart(""); setTimeEnd(""); setStartDate(""); setEndDate(""); setTotalHours(0); return;
    }
    const sorted = [...selectedSlots].sort((a, b) => a - b);
    const start = slots[sorted[0]].split("-")[0].trim();
    const end = slots[sorted[sorted.length - 1]].split("-")[1].trim();
    const [sh, sm] = start.split(":").map(Number);
    const [eh, em] = end.split(":").map(Number);
    const [oh] = openHours.split(":").map(Number);
    const [year, month, day] = bookingDateFormatted.split("-").map(Number);
    const sObj = new Date(Date.UTC(year, month - 1, day));
    const eObj = new Date(Date.UTC(year, month - 1, day));
    if (sh < oh) { sObj.setUTCDate(sObj.getUTCDate() + 1); eObj.setUTCDate(eObj.getUTCDate() + 1); }
    if (eh < sh || (eh === sh && em < sm)) eObj.setUTCDate(eObj.getUTCDate() + 1);
    setStartDate(sObj.toISOString().split("T")[0]);
    setEndDate(eObj.toISOString().split("T")[0]);
    setTimeStart(start); setTimeEnd(end);
    let mins = (eh * 60 + em) - (sh * 60 + sm);
    if (mins < 0) mins += 24 * 60;
    setTotalHours(mins / 60);
  }, [selectedSlots, slots, openHours, bookingDateFormatted]);

  useEffect(() => { calculateSelectedTimes(); }, [calculateSelectedTimes]);

  useEffect(() => {
    const sumFacPrice = Object.values(selectedFacilities).reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    setSumFac(sumFacPrice);
    const total = (newPrice * totalHours) + sumFacPrice;
    setTotalPrice(total);
    setTotalRemaining(total - priceDeposit);
  }, [newPrice, totalHours, selectedFacilities, priceDeposit]);

  const handlePriceOnChange = (val) => {
    setSelectPrice(val);
    if (val === "subFieldPrice") {
      setNewPrice(price);
      setActivity(subFieldData.sport_name);
    } else {
      const addOn = addOns.find(a => a.add_on_id === parseInt(val));
      if (addOn) { setNewPrice(addOn.price); setActivity(addOn.content); }
    }
  };

  const handleFacilitySelect = (facId, facPrice, facName) => {
    setSelectedFacilities(prev => {
      const copy = { ...prev };
      if (copy[facId]) delete copy[facId];
      else copy[facId] = { field_fac_id: facId, fac_name: facName, price: facPrice, quantity: 1 };
      return copy;
    });
  };

  const resetSelection = () => {
    setStartDate(""); setEndDate(""); setCanBook(false); setSelectedSlots([]); setSelectedSlotsArr([]); setPayMethod("");
    setSelectedFacilities({}); setTimeStart(""); setTimeEnd(""); setTotalHours(0);
    setTotalPrice(0); setTotalRemaining(0); setSumFac(0); setShowSummary(false);
  };

  const handleShowSummary = () => {
    setShowSummary(true);
  };

  const handleSubmit = async () => {
    setStartProcessLoad(true);
    const facilityList = Object.values(selectedFacilities).map(f => ({ field_fac_id: f.field_fac_id, fac_name: f.fac_name, quantity: f.quantity }));
    const data = {
      fieldId, userId: user?.user_id, subFieldId, bookingDate: bookingDateFormatted,
      startTime: timeStart, startDate, endTime: timeEnd, endDate,
      selectedSlots: selectedSlotsArr, totalHours, totalPrice, payMethod,
      totalRemaining, activity, selectedFacilities: facilityList, status: BOOKING_STATUS.PENDING
    };
    try {
      await apiClient.postForm("/booking", { data: JSON.stringify(data) });
      notify("บันทึกการจองสำเร็จ", "success");
      resetSelection();
      fetchBookedSlots(); 
    } catch (error) {
      if (error.status === 429) router.push("/api-rate-limited");
      else notify(error.message || "เกิดข้อผิดพลาด", "error");
    } finally {
      setStartProcessLoad(false);
    }
  };

  const summaryRef = useRef(null);

  const toggleSelectSlot = (index) => {
    setShowSummary(false);
    if (selectedSlots.length === 0 || selectedSlots.length >= 2) {
      setSelectedSlots([index]);
      setSelectedSlotsArr([slots[index]]);
    } else {
      const range = [selectedSlots[0], index].sort((a, b) => a - b);
      const idxs = []; const slts = [];
      for (let i = range[0]; i <= range[1]; i++) { idxs.push(i); slts.push(slots[i]); }
      setSelectedSlots(idxs);
      setSelectedSlotsArr(slts);
    }
    setCanBook(true);
  };

  return {
    openHours, closeHours, slots, selectedSlots, selectedSlotsArr, canBook, timeStart, timeEnd,
    startDate, endDate, totalHours, price, newPrice, addOns, activity, facilities, selectPrice,
    selectedFacilities, priceDeposit, sumFac, totalPrice, totalRemaining, payMethod, setPayMethod,
    bookingDate, setBookingDate, openDays, isBooked, subFieldData, fieldId, fieldName,
    showSummary, setShowSummary, bookTimeArr, dataLoading, startProcessLoad, facilityAvailability,
    serverTime, handlePriceOnChange, handleFacilitySelect, resetSelection, handleSubmit, toggleSelectSlot,
    bookingDateFormatted, summaryRef, handleShowSummary
  };
}
