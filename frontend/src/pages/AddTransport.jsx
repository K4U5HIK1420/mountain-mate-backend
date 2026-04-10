import API from "../utils/api";
import React, { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, ShieldCheck } from "lucide-react";
import { useNotify } from "../context/NotificationContext";
import StepBasicInfo from "../components/transportOnboarding/StepBasicInfo";
import StepRideDetails from "../components/transportOnboarding/StepRideDetails";
import StepPricingSeats from "../components/transportOnboarding/StepPricingSeats";
import StepDocuments from "../components/transportOnboarding/StepDocuments";
import { geocodePlace, getBrowserLocation, reverseGeocode } from "../utils/location";
import {
  cleanValue,
  digitsOnly,
  isValidAadhaar,
  isValidPan,
  isValidPhone,
  isValidVehiclePlate,
  normalizePan,
  normalizePhone,
  normalizeVehiclePlate,
} from "../utils/validation";

const DRAFT_KEY = "mm_offer_ride_wizard_v1";
const TOTAL_STEPS = 4;
const LOCATION_DEBOUNCE_MS = 450;

const transportDocumentFields = [
  "driverPhoto",
  "driverLicenseDoc",
  "driverAadhaarDoc",
  "vehicleRcDoc",
  "vehicleInsuranceDoc",
  "vehiclePermitDoc",
  "pollutionCertificateDoc",
  "fitnessCertificateDoc",
];

const createEmptyForm = () => ({
  rideMode: "car_pooling",
  vehicleModel: "",
  plateNumber: "",
  vehicleType: "",
  driverName: "",
  routeFrom: "",
  routeTo: "",
  availableDate: "",
  pricePerSeat: "",
  seatsAvailable: "1",
  contactNumber: "",
  driverLicenseNumber: "",
  driverAadhaarNumber: "",
  driverPanNumber: "",
  rcNumber: "",
  insurancePolicyNumber: "",
  permitNumber: "",
  pollutionCertificateNumber: "",
  fitnessCertificateNumber: "",
});

const createEmptyDocs = () =>
  transportDocumentFields.reduce((acc, key) => {
    acc[key] = null;
    return acc;
  }, {});

const stepHints = {
  1: "Required identity details first.",
  2: "Set route and date.",
  3: "Optional step. Add pricing now for better booking conversion.",
  4: "Final required KYC checks before publish.",
};

function validateStep(step, formData) {
  const errors = {};

  if (step === 1) {
    if (!cleanValue(formData.vehicleModel)) errors.vehicleModel = "Vehicle model is required.";
    if (!cleanValue(formData.plateNumber)) {
      errors.plateNumber = "Plate number is required.";
    } else if (!isValidVehiclePlate(formData.plateNumber)) {
      errors.plateNumber = "Enter a valid vehicle number.";
    }
    if (!cleanValue(formData.driverName)) errors.driverName = "Driver name is required.";
    if (!cleanValue(formData.vehicleType)) errors.vehicleType = "Vehicle type is required.";
    if (!cleanValue(formData.contactNumber)) {
      errors.contactNumber = "Phone number is required.";
    } else if (!isValidPhone(formData.contactNumber)) {
      errors.contactNumber = "Enter a valid phone number.";
    }
  }

  if (step === 2) {
    if (!cleanValue(formData.routeFrom)) errors.routeFrom = "Origin is required.";
    if (!cleanValue(formData.routeTo)) errors.routeTo = "Destination is required.";
    if (
      cleanValue(formData.routeFrom) &&
      cleanValue(formData.routeTo) &&
      cleanValue(formData.routeFrom).toLowerCase() === cleanValue(formData.routeTo).toLowerCase()
    ) {
      errors.routeTo = "Destination should be different from origin.";
    }
    if (!formData.availableDate) errors.availableDate = "Date is required.";
  }

  return errors;
}

function validatePublishMandatory(formData, documents) {
  const errors = {};
  if (!cleanValue(formData.driverLicenseNumber)) {
    errors.driverLicenseNumber = "Driver license number is required.";
  }
  if (!cleanValue(formData.driverAadhaarNumber)) {
    errors.driverAadhaarNumber = "Driver Aadhaar number is required.";
  } else if (!isValidAadhaar(formData.driverAadhaarNumber)) {
    errors.driverAadhaarNumber = "Enter a valid 12-digit Aadhaar number.";
  }
  if (cleanValue(formData.driverPanNumber) && !isValidPan(formData.driverPanNumber)) {
    errors.driverPanNumber = "Enter a valid PAN number.";
  }
  if (!documents?.driverAadhaarDoc) {
    errors.driverAadhaarDoc = "Driver Aadhaar photo is required.";
  }
  return errors;
}

export default function AddTransport() {
  const { notify } = useNotify();

  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(createEmptyForm);
  const [documents, setDocuments] = useState(createEmptyDocs);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const [liveFromCoords, setLiveFromCoords] = useState(null);
  const [liveToCoords, setLiveToCoords] = useState(null);
  const [locating, setLocating] = useState(false);
  const [usingLivePickup, setUsingLivePickup] = useState(false);
  const [resolvingRoute, setResolvingRoute] = useState({ from: false, to: false });

  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw);

      if (parsed?.formData) setFormData((prev) => ({ ...prev, ...parsed.formData }));
      if (parsed?.currentStep) setCurrentStep(Math.min(Math.max(Number(parsed.currentStep), 1), TOTAL_STEPS));
      if (parsed?.liveFromCoords) setLiveFromCoords(parsed.liveFromCoords);
      if (parsed?.liveToCoords) setLiveToCoords(parsed.liveToCoords);
      if (typeof parsed?.usingLivePickup === "boolean") setUsingLivePickup(parsed.usingLivePickup);
    } catch (_err) {
      // ignore broken draft
    }
  }, []);

  useEffect(() => {
    const payload = {
      formData,
      currentStep,
      liveFromCoords,
      liveToCoords,
      usingLivePickup,
      updatedAt: new Date().toISOString(),
    };
    localStorage.setItem(DRAFT_KEY, JSON.stringify(payload));
  }, [formData, currentStep, liveFromCoords, liveToCoords, usingLivePickup]);

  const getCoords = async (place) => geocodePlace(place);

  useEffect(() => {
    let active = true;
    let timer;

    const syncFrom = async () => {
      if (!formData.routeFrom.trim()) {
        if (active) setLiveFromCoords(null);
        return;
      }

      if (usingLivePickup) return;

      if (active) setResolvingRoute((prev) => ({ ...prev, from: true }));
      const coords = await getCoords(formData.routeFrom);
      if (active) {
        setLiveFromCoords(coords || null);
        setResolvingRoute((prev) => ({ ...prev, from: false }));
      }
    };

    timer = setTimeout(syncFrom, LOCATION_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.routeFrom, usingLivePickup]);

  useEffect(() => {
    let active = true;
    let timer;

    const syncTo = async () => {
      if (!formData.routeTo.trim()) {
        if (active) {
          setLiveToCoords(null);
          setResolvingRoute((prev) => ({ ...prev, to: false }));
        }
        return;
      }
      if (active) setResolvingRoute((prev) => ({ ...prev, to: true }));
      const coords = await getCoords(formData.routeTo);
      if (active) {
        setLiveToCoords(coords || null);
        setResolvingRoute((prev) => ({ ...prev, to: false }));
      }
    };

    timer = setTimeout(syncTo, LOCATION_DEBOUNCE_MS);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [formData.routeTo]);

  const handleFieldChange = (event) => {
    const { name, value } = event.target;
    let nextValue = value;
    if (name === "contactNumber") nextValue = normalizePhone(value);
    if (name === "plateNumber") nextValue = normalizeVehiclePlate(value);
    if (name === "driverPanNumber") nextValue = normalizePan(value);
    if (name === "driverAadhaarNumber") nextValue = digitsOnly(value).slice(0, 12);
    setFormData((prev) => ({ ...prev, [name]: nextValue }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleOriginChange = (event) => {
    handleFieldChange(event);
    setUsingLivePickup(false);
    setLiveFromCoords(null);
  };

  const handleDestinationChange = (event) => {
    handleFieldChange(event);
    setLiveToCoords(null);
  };

  const handleImageChange = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;
    setImages((prev) => [...prev, ...files]);
    setPreviews((prev) => [...prev, ...files.map((file) => URL.createObjectURL(file))]);
  };

  const handleDocumentChange = (key, file) => {
    setDocuments((prev) => ({ ...prev, [key]: file || null }));
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setPreviews((prev) => prev.filter((_, i) => i !== index));
  };

  const captureLivePickup = () => {
    setLocating(true);
    getBrowserLocation()
      .then(async (position) => {
        const coords = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        const label = await reverseGeocode(coords.lat, coords.lng);
        setFormData((prev) => ({ ...prev, routeFrom: label }));
        setLiveFromCoords(coords);
        setUsingLivePickup(true);
        setLocating(false);
        notify("Live pickup location captured.", "success");
      })
      .catch(() => {
        setLocating(false);
        notify("Allow location permission to capture live pickup.", "error");
      });
  };

  const progressPercent = (currentStep / TOTAL_STEPS) * 100;

  const validateAndProceed = () => {
    if (currentStep === 1 || currentStep === 2) {
      const nextErrors = validateStep(currentStep, formData);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        return;
      }
    }

    setErrors({});
    setCurrentStep((prev) => Math.min(prev + 1, TOTAL_STEPS));
  };

  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSkip = () => {
    if (currentStep === 3) {
      setCurrentStep((prev) => prev + 1);
    }
  };

  const resetForm = () => {
    setFormData(createEmptyForm());
    setDocuments(createEmptyDocs());
    setImages([]);
    setPreviews([]);
    setErrors({});
    setCurrentStep(1);
    setLiveFromCoords(null);
    setLiveToCoords(null);
    setUsingLivePickup(false);
    localStorage.removeItem(DRAFT_KEY);
  };

  const publishRide = async () => {
    const step1Errors = validateStep(1, formData);
    const step2Errors = validateStep(2, formData);
    const mandatoryKycErrors = validatePublishMandatory(formData, documents);
    const mergedErrors = { ...step1Errors, ...step2Errors, ...mandatoryKycErrors };

    if (Object.keys(mergedErrors).length > 0) {
      setErrors(mergedErrors);
      if (
        step1Errors.vehicleModel ||
        step1Errors.plateNumber ||
        step1Errors.driverName ||
        step1Errors.vehicleType ||
        step1Errors.contactNumber
      ) {
        setCurrentStep(1);
      } else if (step2Errors.routeFrom || step2Errors.routeTo || step2Errors.availableDate) {
        setCurrentStep(2);
      } else {
        setCurrentStep(4);
      }
      notify("Please complete all mandatory fields before publish.", "error");
      return;
    }

    setLoading(true);

    try {
      const fromCoords = liveFromCoords || (await getCoords(formData.routeFrom));
      const toCoords = liveToCoords || (await getCoords(formData.routeTo));
      if (!fromCoords || !toCoords) {
        notify("Please enter valid origin and destination locations.", "error");
        setCurrentStep(2);
        return;
      }

      const payload = {
        ...formData,
        vehicleModel: cleanValue(formData.vehicleModel),
        plateNumber: normalizeVehiclePlate(formData.plateNumber),
        driverName: cleanValue(formData.driverName),
        contactNumber: normalizePhone(formData.contactNumber),
        driverPanNumber: cleanValue(formData.driverPanNumber) ? normalizePan(formData.driverPanNumber) : "",
        driverAadhaarNumber: cleanValue(formData.driverAadhaarNumber) ? digitsOnly(formData.driverAadhaarNumber) : "",
        pricePerSeat: formData.pricePerSeat || "0",
        seatsAvailable: formData.seatsAvailable || "1",
      };

      const data = new FormData();
      Object.entries(payload).forEach(([key, value]) => data.append(key, value));
      data.append("fromCoords", JSON.stringify(fromCoords));
      data.append("toCoords", JSON.stringify(toCoords));

      images.forEach((file) => data.append("images", file));
      Object.entries(documents).forEach(([key, file]) => {
        if (file) data.append(key, file);
      });

      const response = await API.post("/transport/add", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (response.data?.success) {
        notify("Ride published successfully. You can complete optional details later.", "success");
        resetForm();
      }
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || "Ride publish failed.", "error");
    } finally {
      setLoading(false);
    }
  };

  const stepComponent = useMemo(() => {
    if (currentStep === 1) {
      return <StepBasicInfo formData={formData} errors={errors} onFieldChange={handleFieldChange} />;
    }
    if (currentStep === 2) {
      return (
        <StepRideDetails
          formData={formData}
          errors={errors}
          onFieldChange={handleFieldChange}
          onOriginChange={handleOriginChange}
          onDestinationChange={handleDestinationChange}
          onCaptureLivePickup={captureLivePickup}
          locating={locating}
          resolvingRoute={resolvingRoute}
          liveFromCoords={liveFromCoords}
          liveToCoords={liveToCoords}
        />
      );
    }
    if (currentStep === 3) {
      return <StepPricingSeats formData={formData} onFieldChange={handleFieldChange} />;
    }
    return (
      <StepDocuments
        documents={documents}
        onDocumentChange={handleDocumentChange}
        images={images}
        previews={previews}
        onImageChange={handleImageChange}
        onRemoveImage={removeImage}
        formData={formData}
        onFieldChange={handleFieldChange}
        errors={errors}
      />
    );
  }, [currentStep, formData, errors, locating, liveFromCoords, liveToCoords, documents, images, previews]);

  return (
    <div className="min-h-screen bg-[#050505] px-4 pb-16 pt-32 text-white md:px-8">
      <div className="mx-auto w-full max-w-4xl">
        <div className="mb-6 rounded-[32px] border border-white/10 bg-white/[0.03] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.25em] text-[#FFB37D]">Offer a Ride</p>
              <h1 className="mt-2 text-3xl font-black tracking-tight md:text-4xl">Fast driver onboarding wizard</h1>
              <p className="mt-2 text-sm text-white/60">{stepHints[currentStep]}</p>
            </div>
            <div className="rounded-full border border-[#FF6A00]/30 bg-[#FF6A00]/10 px-4 py-2 text-xs font-bold text-[#FFD4B1]">
              Step {currentStep} of {TOTAL_STEPS}
            </div>
          </div>

          <div className="mt-5">
            <div className="h-2 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#FF6A00] to-[#FF914D]"
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 0.35, ease: "easeOut" }}
              />
            </div>
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            transition={{ duration: 0.22 }}
          >
            {stepComponent}
          </motion.div>
        </AnimatePresence>

        <div className="mt-6 rounded-[28px] border border-white/10 bg-white/[0.03] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.35)] backdrop-blur-xl">
          <div className="mb-4 flex items-start gap-3 rounded-2xl border border-[#FF6A00]/20 bg-[#FF6A00]/10 p-3 text-sm text-[#FFD4B1]">
            <ShieldCheck size={16} className="mt-0.5 shrink-0" />
            <span>Documents can be uploaded later. You only need Step 1 and Step 2 to publish your ride.</span>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={handleBack}
              disabled={currentStep === 1 || loading}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/15 bg-black/40 px-5 py-3 text-sm font-semibold text-white transition hover:border-white/35 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <ArrowLeft size={16} />
              Back
            </button>

            <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:justify-end">
              {currentStep === 3 ? (
                <button
                  type="button"
                  onClick={handleSkip}
                  disabled={loading}
                  className="rounded-2xl border border-white/15 bg-black/40 px-5 py-3 text-sm font-semibold text-white/80 transition hover:border-white/35"
                >
                  Skip for now
                </button>
              ) : null}

              {currentStep < TOTAL_STEPS ? (
                <button
                  type="button"
                  onClick={validateAndProceed}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-[#FF6A00]/30 bg-[#FF6A00]/10 px-5 py-3 text-sm font-bold text-[#FFD4B1] transition hover:bg-[#FF6A00]/20 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Next
                  <ArrowRight size={16} />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={publishRide}
                  disabled={loading}
                  className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#FF6A00] px-5 py-3 text-sm font-bold text-white transition hover:bg-[#ff7d26] disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  Publish ride
                </button>
              )}
            </div>
          </div>

          <p className="mt-4 text-xs text-white/45">Your progress is auto-saved on this device.</p>
        </div>
      </div>
    </div>
  );
}
