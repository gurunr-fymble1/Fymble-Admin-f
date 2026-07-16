"use client";
import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { 
  HiOutlineArrowLeft, 
  HiOutlineSave,
  HiOutlineUser,
  HiOutlineScale,
  HiOutlineDocumentText,
  HiOutlineHeart,
  HiOutlineClock,
  HiOutlineStar,
  HiOutlineLightningBolt,
  HiOutlineBeaker,
  HiOutlineChartBar,
  HiCheck
} from "react-icons/hi";
import axios from "@/lib/axios";

export default function ConsultationForm() {
  const { clientId } = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    client_id: clientId,
    full_name: "",
    age: "",
    gender: "",
    occupation: "",
    main_health_goal: "",
    native: "",
    current_place: "",
    
    anthropometric_table: {
      weight: { current: "", goal: "" },
      height: { current: "", goal: "" },
      bmi: { current: "", goal: "" },
      waist: { current: "", goal: "" },
      hip: { current: "", goal: "" },
      whr: { current: "", goal: "" },
      muscle_mass: { current: "", goal: "" },
      body_fat: { current: "", goal: "" },
      ibw: { current: "", goal: "" },
    },
    recent_changes: {
      weight_gain: false,
      weight_loss: false,
      no_major_change: false,
    },
    fat_distribution: {
      abdomen: false,
      hips: false,
      thighs: false,
      overall: false,
    },
    nutritionist_notes: "",
    
    vitamin_deficiencies: "",
    biochemical_issues: "",
    ongoing_medications: "",
    
    clinical_concerns: {
      low_energy: "Never",
      bloating_acidity: "Never",
      poor_sleep: "Never",
      stress: "Never",
      constipation: "Never",
      hair_fall: "Never",
      cravings: "Never",
    },
    edema_swelling: "",
    joint_pain: "",
    weakness_dizziness: "",
    other_symptoms: "",
    
    meals_daily: "",
    skip_breakfast: "",
    dinner_timing: "",
    late_night_eating: "",
    diet_preference: "",
    water_intake: "",
    eat_outside_frequency: "",
    food_allergies: "",
    cooking_time: "",
    stay_arrangement: "",
    eating_pattern_desc: "",
    
    daily_routine: {
      work_schedule: "",
      wake_up_time: "",
      sleep_time: "",
      screen_time: "",
      sitting_hours: "",
    },
    lifestyle_habits: {
      water_intake: "",
      smoking_alcohol: "",
      eating_outside: "",
      travel_frequency: "",
      cooking_time: "",
    },
    exercise_routine: "",
    step_count: "",
    activity_level: "",
    work_mode: "",
    
    main_goals: "",
    consistency_challenges: "",
    expected_support: "",
  });

  useEffect(() => {
    const fetchFormData = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/admin/nutritionist_consultation/${clientId}`);
        if (response.data?.success && response.data?.data) {
          const existingData = response.data.data;
          setFormData(prev => ({
            ...prev,
            ...existingData,
            anthropometric_table: existingData.anthropometric_table || prev.anthropometric_table,
            recent_changes: existingData.recent_changes || prev.recent_changes,
            fat_distribution: existingData.fat_distribution || prev.fat_distribution,
            clinical_concerns: existingData.clinical_concerns || prev.clinical_concerns,
            daily_routine: existingData.daily_routine || prev.daily_routine,
            lifestyle_habits: existingData.lifestyle_habits || prev.lifestyle_habits,
          }));
        }
      } catch (err) {
        console.error("Error fetching form data:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchFormData();
  }, [clientId]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleNestedChange = (section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value,
      },
    }));
  };

  const handleAnthroChange = (field, type, value) => {
    setFormData((prev) => {
      const updatedAnthro = {
        ...prev.anthropometric_table,
        [field]: {
          ...prev.anthropometric_table[field],
          [type]: value,
        },
      };

      // Auto-calculate BMI if weight or height changes
      if (field === "weight" || field === "height") {
        const weight = parseFloat(updatedAnthro.weight[type]) || 0;
        const height = parseFloat(updatedAnthro.height[type]) || 0;

        if (weight > 0 && height > 0) {
          const heightInMeters = height / 100;
          const bmi = (weight / (heightInMeters * heightInMeters)).toFixed(1);
          updatedAnthro.bmi = {
            ...updatedAnthro.bmi,
            [type]: bmi
          };
        }
      }

      return {
        ...prev,
        anthropometric_table: updatedAnthro,
      };
    });
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    try {
      setSaving(true);
      setMessage({ type: "", text: "" });
      const response = await axios.post("/api/admin/nutritionist_consultation/save", formData);
      if (response.data?.success) {
        setMessage({ type: "success", text: "Consultation saved successfully!" });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (err) {
      setMessage({ type: "error", text: "Error connecting to server" });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh", backgroundColor: "#f9fafb" }}>
        <div style={{ fontSize: "16px", color: "#10b981", fontWeight: "600" }}>LOADING PORTAL...</div>
      </div>
    );
  }

  const sectionWrapper = {
    backgroundColor: "#ffffff",
    borderRadius: "20px",
    padding: "40px",
    marginBottom: "30px",
    boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05)",
    border: "1px solid #f3f4f6"
  };

  const inputStyle = {
    width: "100%",
    backgroundColor: "#f9fafb",
    border: "1px solid #e5e7eb",
    borderRadius: "12px",
    padding: "14px 18px",
    color: "#111827",
    fontSize: "15px",
    outline: "none",
    transition: "all 0.2s ease",
    boxSizing: "border-box"
  };

  const labelStyle = {
    display: "block",
    fontSize: "13px",
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: "10px",
    textTransform: "uppercase",
    letterSpacing: "0.5px"
  };

  const SectionTitle = ({ icon: Icon, title, sub }) => (
    <div style={{ marginBottom: "35px" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
        <div style={{ color: "#10b981" }}><Icon size={22} /></div>
        <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 }}>{title}</h2>
      </div>
      <p style={{ fontSize: "14px", color: "#9ca3af", margin: 0 }}>{sub}</p>
    </div>
  );

  const SectionIcon = ({ icon: Icon }) => (
    <Icon size={18} style={{ color: "inherit" }} />
  );

  const sections = [
    { id: "section-profile",      label: "Profile",      icon: HiOutlineUser },
    { id: "section-body",         label: "Body",         icon: HiOutlineScale },
    { id: "section-biochemical",  label: "Biochemical",  icon: HiOutlineBeaker },
    { id: "section-symptoms",     label: "Symptoms",     icon: HiOutlineHeart },
    { id: "section-dietary",      label: "Dietary",      icon: HiOutlineClock },
    { id: "section-lifestyle",    label: "Lifestyle",    icon: HiOutlineStar },
    { id: "section-movement",     label: "Movement",     icon: HiOutlineLightningBolt },
    { id: "section-goals",        label: "Goals",        icon: HiOutlineChartBar },
  ];

  const scrollToSection = (id) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div style={{ backgroundColor: "#f9fafb", minHeight: "100vh", padding: "15px" }}>

      {/* Fixed Section Navigation - Right Side */}
      <div style={{
        position: "fixed",
        right: "16px",
        top: "50%",
        transform: "translateY(-50%)",
        zIndex: 1000,
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        backgroundColor: "#111827",
        borderRadius: "18px",
        padding: "12px 8px",
        boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
        border: "1px solid #1f2937",
      }}>
        {/* Emerald top accent bar */}
        <div style={{
          width: "32px",
          height: "3px",
          backgroundColor: "#10b981",
          borderRadius: "4px",
          margin: "0 auto 8px auto",
        }} />
        {sections.map((s) => (
          <button
            key={s.id}
            onClick={() => scrollToSection(s.id)}
            title={s.label}
            style={{
              background: "transparent",
              border: "none",
              borderRadius: "12px",
              padding: "7px 10px",
              cursor: "pointer",
              fontSize: "10px",
              fontWeight: "700",
              color: "#9ca3af",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: "3px",
              transition: "all 0.15s ease",
              minWidth: "52px",
              lineHeight: "1.2",
              letterSpacing: "0.3px",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "rgba(16, 185, 129, 0.15)";
              e.currentTarget.style.color = "#10b981";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.color = "#9ca3af";
            }}
          >
            <SectionIcon icon={s.icon} />
            <span>{s.label}</span>
          </button>
        ))}
        {/* Emerald bottom accent dot */}
        <div style={{
          width: "6px",
          height: "6px",
          backgroundColor: "#10b981",
          borderRadius: "50%",
          margin: "8px auto 0 auto",
        }} />
      </div>

      <div style={{ maxWidth: "1000px", margin: "0 auto 0 20px" }}>
        
        {/* Top Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "25px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button 
              onClick={() => router.back()}
              style={{ 
                display: "flex", 
                alignItems: "center", 
                justifyContent: "center",
                background: "#fff", 
                border: "1px solid #e5e7eb", 
                color: "#10b981", 
                cursor: "pointer", 
                width: "44px",
                height: "44px",
                borderRadius: "12px",
                boxShadow: "0 2px 4px rgba(0,0,0,0.05)"
              }}
            >
              <HiOutlineArrowLeft size={20} />
            </button>
            <h1 style={{ fontSize: "32px", fontWeight: "800", color: "#111827", margin: 0, letterSpacing: "-0.025em" }}>
              Consultation <span style={{ color: "#10b981" }}>Report</span>
            </h1>
          </div>
          
          <button 
            onClick={handleSubmit} 
            disabled={saving}
            style={{
              backgroundColor: "#10b981",
              color: "#ffffff",
              border: "none",
              padding: "16px 32px",
              borderRadius: "14px",
              fontSize: "15px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "10px",
              boxShadow: "0 10px 15px -3px rgba(16, 185, 129, 0.3)",
              transition: "transform 0.1s"
            }}
          >
            {saving ? "Saving..." : <><HiOutlineSave size={20} /> Finish & Save</>}
          </button>
        </div>

        {message.text && (
          <div style={{ 
            padding: "16px 24px", 
            borderRadius: "14px", 
            marginBottom: "30px", 
            backgroundColor: message.type === "success" ? "#ecfdf5" : "#fef2f2",
            color: message.type === "success" ? "#059669" : "#dc2626",
            border: `1px solid ${message.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            fontWeight: "600",
            display: "flex",
            alignItems: "center",
            gap: "12px"
          }}>
            {message.type === "success" && <HiCheck size={18} />}
            {message.text}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          
          {/* Section 1: Client Profile */}
          <div id="section-profile" style={sectionWrapper}>
            <SectionTitle icon={HiOutlineUser} title="Client Profile" sub="General information and health objectives" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Full Name</label>
                <input style={inputStyle} name="full_name" value={formData.full_name || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Age</label>
                <input style={inputStyle} name="age" value={formData.age || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Gender</label>
                <select style={inputStyle} name="gender" value={formData.gender || ""} onChange={handleInputChange}>
                  <option value="">Select Gender</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Others">Others</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Occupation</label>
                <input style={inputStyle} name="occupation" value={formData.occupation || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Health Goal</label>
                <input style={inputStyle} name="main_health_goal" value={formData.main_health_goal || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Native</label>
                <input style={inputStyle} name="native" value={formData.native || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Current Place</label>
                <input style={inputStyle} name="current_place" value={formData.current_place || ""} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          {/* Section 2: Body Metrics */}
          <div id="section-body" style={sectionWrapper}>
            <SectionTitle icon={HiOutlineScale} title="Body Metrics" sub="Physical assessment and measurements" />
            
            <div style={{ borderRadius: "16px", overflow: "hidden", border: "1px solid #f3f4f6", marginBottom: "35px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ backgroundColor: "#f9fafb" }}>
                    <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", color: "#9ca3af", fontWeight: "700" }}>ASSESSMENT</th>
                    <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", color: "#9ca3af", fontWeight: "700" }}>CURRENT</th>
                    <th style={{ textAlign: "left", padding: "16px", fontSize: "12px", color: "#9ca3af", fontWeight: "700" }}>IDEAL / GOAL</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Weight (kg)", field: "weight" },
                    { label: "Height (cm)", field: "height" },
                    { label: "BMI", field: "bmi" },
                    { label: "Waist (cm)", field: "waist" },
                    { label: "Hip (cm)", field: "hip" },
                    { label: "WHR", field: "whr" },
                    { label: "Muscle Mass", field: "muscle_mass" },
                    { label: "Body Fat %", field: "body_fat" },
                    { label: "IBW (Ideal)", field: "ibw" },
                  ].map((item, idx) => (
                    <tr key={item.field} style={{ borderTop: "1px solid #f3f4f6" }}>
                      <td style={{ padding: "16px", color: "#374151", fontWeight: "600", fontSize: "14px" }}>{item.label}</td>
                      <td style={{ padding: "12px" }}>
                        <input 
                          style={{ ...inputStyle, padding: "10px 14px", fontSize: "14px" }} 
                          value={formData.anthropometric_table?.[item.field]?.current || ""} 
                          onChange={(e) => handleAnthroChange(item.field, "current", e.target.value)}
                        />
                      </td>
                      <td style={{ padding: "12px" }}>
                        <input 
                          style={{ ...inputStyle, padding: "10px 14px", fontSize: "14px" }} 
                          value={formData.anthropometric_table?.[item.field]?.goal || ""} 
                          onChange={(e) => handleAnthroChange(item.field, "goal", e.target.value)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "30px" }}>
              <div>
                <label style={labelStyle}>Weight Trends</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {Object.keys(formData.recent_changes).map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNestedChange("recent_changes", key, !formData.recent_changes[key])}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "600",
                        border: `2px solid ${formData.recent_changes[key] ? "#10b981" : "#f3f4f6"}`,
                        backgroundColor: formData.recent_changes[key] ? "#ecfdf5" : "#ffffff",
                        color: formData.recent_changes[key] ? "#10b981" : "#9ca3af",
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      {key.replace(/_/g, ' ')}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label style={labelStyle}>Fat Distribution</label>
                <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                  {Object.keys(formData.fat_distribution).map(key => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => handleNestedChange("fat_distribution", key, !formData.fat_distribution[key])}
                      style={{
                        padding: "10px 16px",
                        borderRadius: "10px",
                        fontSize: "13px",
                        fontWeight: "600",
                        border: `2px solid ${formData.fat_distribution[key] ? "#10b981" : "#f3f4f6"}`,
                        backgroundColor: formData.fat_distribution[key] ? "#ecfdf5" : "#ffffff",
                        color: formData.fat_distribution[key] ? "#10b981" : "#9ca3af",
                        cursor: "pointer"
                      }}
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label style={labelStyle}>Clinical Observations</label>
              <textarea 
                style={{ ...inputStyle, minHeight: "100px", resize: "vertical" }} 
                name="nutritionist_notes" 
                value={formData.nutritionist_notes || ""} 
                onChange={handleInputChange}
                placeholder="Visual assessment, skin health, muscle tone..."
              />
            </div>
          </div>

          {/* Section 3: Biochemical */}
          <div id="section-biochemical" style={sectionWrapper}>
            <SectionTitle icon={HiOutlineDocumentText} title="Biochemical Markers" sub="Blood work and metabolic status" />
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              <div>
                <label style={labelStyle}>Deficiencies</label>
                <input style={inputStyle} name="vitamin_deficiencies" value={formData.vitamin_deficiencies || ""} onChange={handleInputChange} placeholder="e.g., Vitamin D, Iron" />
              </div>
              <div>
                <label style={labelStyle}>Metabolic Issues (Thyroid, Sugar, Cholesterol)</label>
                <textarea style={{ ...inputStyle, minHeight: "80px" }} name="biochemical_issues" value={formData.biochemical_issues || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Current Medications</label>
                <input style={inputStyle} name="ongoing_medications" value={formData.ongoing_medications || ""} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          {/* Section 4: Clinical Symptoms */}
          <div id="section-symptoms" style={sectionWrapper}>
            <SectionTitle icon={HiOutlineHeart} title="Clinical Symptoms" sub="Physical manifestations and digestive health" />
            
            <div style={{ overflowX: "auto", marginBottom: "30px" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "1px solid #f3f4f6" }}>
                    <th style={{ textAlign: "left", padding: "16px", color: "#9ca3af", fontSize: "12px" }}>CONCERN</th>
                    {["Never", "Sometimes", "Often", "Severe"].map(opt => (
                      <th key={opt} style={{ textAlign: "center", padding: "16px", color: "#9ca3af", fontSize: "12px" }}>{opt}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[
                    { label: "Energy Fatigue", field: "low_energy" },
                    { label: "Bloating / Acidity", field: "bloating_acidity" },
                    { label: "Poor Sleep", field: "poor_sleep" },
                    { label: "Stress Load", field: "stress" },
                    { label: "Constipation", field: "constipation" },
                    { label: "Hair Fall", field: "hair_fall" },
                    { label: "Cravings", field: "cravings" },
                  ].map(item => (
                    <tr key={item.field} style={{ borderBottom: "1px solid #f9fafb" }}>
                      <td style={{ padding: "16px", fontSize: "14px", fontWeight: "600", color: "#374151" }}>{item.label}</td>
                      {["Never", "Sometimes", "Often", "Severe"].map(opt => (
                        <td key={opt} style={{ textAlign: "center" }}>
                          <input 
                            type="radio" 
                            name={item.field} 
                            checked={formData.clinical_concerns[item.field] === opt} 
                            onChange={() => handleNestedChange("clinical_concerns", item.field, opt)}
                            style={{ width: "18px", height: "18px", accentColor: "#10b981", cursor: "pointer" }}
                          />
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
              <div>
                <label style={labelStyle}>Edema / Swelling</label>
                <input style={inputStyle} name="edema_swelling" value={formData.edema_swelling || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Joint Pain</label>
                <input style={inputStyle} name="joint_pain" value={formData.joint_pain || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Weakness / Dizziness</label>
                <input style={inputStyle} name="weakness_dizziness" value={formData.weakness_dizziness || ""} onChange={handleInputChange} />
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Other symptoms or concerns you would like to mention</label>
                <textarea 
                  style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} 
                  name="other_symptoms" 
                  value={formData.other_symptoms || ""} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
          </div>

          {/* Section 5: Dietary Habits */}
          <div id="section-dietary" style={sectionWrapper}>
            <SectionTitle icon={HiOutlineClock} title="Dietary Habits" sub="Eating patterns and preferences" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px", marginBottom: "25px" }}>
              <div>
                <label style={labelStyle}>How many meals do you usually eat daily?</label>
                <input style={inputStyle} name="meals_daily" value={formData.meals_daily || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Do you skip breakfast often?</label>
                <input style={inputStyle} name="skip_breakfast" value={formData.skip_breakfast || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Usual dinner timing</label>
                <input style={inputStyle} name="dinner_timing" value={formData.dinner_timing || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Late-night eating habits</label>
                <input style={inputStyle} name="late_night_eating" value={formData.late_night_eating || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Diet Preference</label>
                <select style={inputStyle} name="diet_preference" value={formData.diet_preference || ""} onChange={handleInputChange}>
                  <option value="">Select</option>
                  <option value="Vegetarian">Vegetarian</option>
                  <option value="Eggetarian">Eggetarian</option>
                  <option value="Non-Vegetarian">Non-Vegetarian</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Daily water intake</label>
                <input style={inputStyle} name="water_intake" value={formData.water_intake || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>How often do you eat outside?</label>
                <input style={inputStyle} name="eat_outside_frequency" value={formData.eat_outside_frequency || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Any food allergies or dislikes?</label>
                <input style={inputStyle} name="food_allergies" value={formData.food_allergies || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>How much time do you get to cook daily?</label>
                <input style={inputStyle} name="cooking_time" value={formData.cooking_time || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Where do you stay currently?</label>
                <select style={inputStyle} name="stay_arrangement" value={formData.stay_arrangement || ""} onChange={handleInputChange}>
                  <option value="">Select</option>
                  <option value="Home">Home</option>
                  <option value="PG">PG</option>
                  <option value="Hostel">Hostel</option>
                  <option value="Alone">Alone</option>
                </select>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Briefly describe your typical eating pattern</label>
                <textarea 
                  style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} 
                  name="eating_pattern_desc" 
                  value={formData.eating_pattern_desc || ""} 
                  onChange={handleInputChange} 
                />
              </div>
            </div>
          </div>

          {/* Section 6: Lifestyle Habits */}
          <div id="section-lifestyle" style={sectionWrapper}>
            <SectionTitle icon={HiOutlineStar} title="Lifestyle Habits" sub="Daily routine and habitual assessment" />
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px" }}>
              <div style={{ backgroundColor: "#f9fafb", padding: "25px", borderRadius: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#10b981", marginBottom: "20px" }}>CIRCADIAN ROUTINE</h3>
                {[
                  { label: "Work Schedule", field: "work_schedule" },
                  { label: "Wake-up Time", field: "wake_up_time" },
                  { label: "Sleep Time", field: "sleep_time" },
                  { label: "Screen Time", field: "screen_time" },
                  { label: "Sitting Hours", field: "sitting_hours" },
                ].map(item => (
                  <div key={item.field} style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" }}>{item.label}</label>
                    <input 
                      style={{ ...inputStyle, padding: "10px", backgroundColor: "#fff" }} 
                      value={formData.daily_routine[item.field]} 
                      onChange={(e) => handleNestedChange("daily_routine", item.field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
              <div style={{ backgroundColor: "#f9fafb", padding: "25px", borderRadius: "16px" }}>
                <h3 style={{ fontSize: "14px", fontWeight: "700", color: "#10b981", marginBottom: "20px" }}>HABITS & FLUIDS</h3>
                {[
                  { label: "Water Intake", field: "water_intake" },
                  { label: "Smoking/Alcohol", field: "smoking_alcohol" },
                  { label: "Eating Outside", field: "eating_outside" },
                  { label: "Travel Frequency", field: "travel_frequency" },
                ].map(item => (
                  <div key={item.field} style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "12px", color: "#9ca3af", display: "block", marginBottom: "6px" }}>{item.label}</label>
                    <input 
                      style={{ ...inputStyle, padding: "10px", backgroundColor: "#fff" }} 
                      value={formData.lifestyle_habits[item.field]} 
                      onChange={(e) => handleNestedChange("lifestyle_habits", item.field, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Section 7: Movement & Activity */}
          <div id="section-movement" style={sectionWrapper}>
            <SectionTitle icon={HiOutlineLightningBolt} title="Movement & Activity" sub="Physical activity and exercise patterns" />
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "25px" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Exercise Routine</label>
                <textarea 
                  style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} 
                  name="exercise_routine" 
                  value={formData.exercise_routine || ""} 
                  onChange={handleInputChange} 
                />
              </div>
              <div>
                <label style={labelStyle}>Step Count</label>
                <input style={inputStyle} name="step_count" value={formData.step_count || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>Activity Level</label>
                <div style={{ display: "flex", gap: "10px" }}>
                  {["Sedentary", "Moderate", "Active"].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, activity_level: p.activity_level === opt ? "" : opt }))}
                      style={{
                        flex: 1, padding: "12px", borderRadius: "10px", fontSize: "13px", fontWeight: "600",
                        border: `2px solid ${formData.activity_level === opt ? "#10b981" : "#f3f4f6"}`,
                        backgroundColor: formData.activity_level === opt ? "#ecfdf5" : "#ffffff",
                        color: formData.activity_level === opt ? "#10b981" : "#9ca3af",
                        cursor: "pointer"
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <label style={labelStyle}>Work Mode</label>
                <div style={{ display: "flex", gap: "15px" }}>
                  {["WFH", "Office", "Hybrid", "None"].map(opt => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setFormData(p => ({ ...p, work_mode: p.work_mode === opt ? "" : opt }))}
                      style={{
                        padding: "12px 30px", borderRadius: "10px", fontSize: "13px", fontWeight: "600",
                        border: `2px solid ${formData.work_mode === opt ? "#10b981" : "#f3f4f6"}`,
                        backgroundColor: formData.work_mode === opt ? "#ecfdf5" : "#ffffff",
                        color: formData.work_mode === opt ? "#10b981" : "#9ca3af",
                        cursor: "pointer"
                      }}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section 8: Goals & Expectations */}
          <div id="section-goals" style={sectionWrapper}>
            <SectionTitle icon={HiOutlineStar} title="Goals & Expectations" sub="Final objectives and support requirements" />
            <div style={{ display: "flex", flexDirection: "column", gap: "25px" }}>
              <div>
                <label style={labelStyle}>What are your main health or fitness goals?</label>
                <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} name="main_goals" value={formData.main_goals || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>What challenges make it difficult to stay consistent?</label>
                <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} name="consistency_challenges" value={formData.consistency_challenges || ""} onChange={handleInputChange} />
              </div>
              <div>
                <label style={labelStyle}>What kind of support are you expecting from your nutritionist?</label>
                <textarea style={{ ...inputStyle, minHeight: "80px", resize: "vertical" }} name="expected_support" value={formData.expected_support || ""} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "15px", marginBottom: "80px" }}>
            <button 
              type="button" 
              onClick={() => router.back()} 
              style={{ backgroundColor: "transparent", color: "#9ca3af", border: "1px solid #e5e7eb", padding: "16px 32px", borderRadius: "14px", cursor: "pointer", fontWeight: "600" }}
            >
              Cancel Changes
            </button>
            <button 
              type="submit" 
              disabled={saving}
              style={{ backgroundColor: "#10b981", color: "#ffffff", border: "none", padding: "16px 50px", borderRadius: "14px", cursor: "pointer", fontWeight: "800", boxShadow: "0 15px 30px rgba(16, 185, 129, 0.25)" }}
            >
              {saving ? "SAVING..." : "COMMIT REPORT"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
