"use client";
import React, { useState, useEffect, useRef, Suspense } from "react";
import { FaTrash, FaSave, FaTimes, FaClock, FaChevronDown, FaChevronRight, FaGripVertical, FaLock, FaCheck } from "react-icons/fa";
import axios from "@/lib/axios";
import { useSecureDelete, SecureDeleteModal } from "@/components/auth/SecureDeleteModal";
import { useSearchParams } from "next/navigation";

const MEAL_TYPES = [
  "Pre-Breakfast", "Breakfast", "Mid-Morning Snack", "Brunch", "Lunch", 
  "Evening Snack", "Pre-Workout", "Post-Workout", "Dinner", 
  "Late Night Snack", "Bedtime Drink", "Detox", "Snack", "Mini Meal"
];
const DEFAULT_MEALS = ["Breakfast", "Lunch", "Evening Snack", "Dinner"];

function CreateTemplateContent() {
  const [view, setView] = useState("create"); // "create" or "list"
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(false);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [error, setError] = useState(null);
  const [editingTemplate, setEditingTemplate] = useState(null);
  const [viewingTemplate, setViewingTemplate] = useState(null); // For viewing template details

  // Template form state
  const [templateName, setTemplateName] = useState("");
  const [numberOfDays, setNumberOfDays] = useState("");
  const [description, setDescription] = useState("");

  const searchParams = useSearchParams();
  const templateIdParam = searchParams.get("template_id");

  useEffect(() => {
    if (templateIdParam) {
      handleEditTemplate(parseInt(templateIdParam));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateIdParam]);
  const [sessionNo, setSessionNo] = useState("");
  const [dietData, setDietData] = useState([]);
  const [activeDayTab, setActiveDayTab] = useState(1);
  const [completedDays, setCompletedDays] = useState([]);
  const { handleDeleteTrigger, secureDeleteProps } = useSecureDelete();

  // Search/Copy from existing template state
  const [copySearchQuery, setCopySearchQuery] = useState("");
  const [showCopyDropdown, setShowCopyDropdown] = useState(false);
  const copyDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (copyDropdownRef.current && !copyDropdownRef.current.contains(event.target)) {
        setShowCopyDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Food search state for autocomplete
  const [foodSuggestions, setFoodSuggestions] = useState({});
  const [searchingFood, setSearchingFood] = useState({});
  const [showSuggestions, setShowSuggestions] = useState({});
  const activeSuggestionRef = useRef({});
  const [foodPagination, setFoodPagination] = useState({}); // { key: { page: 1, hasMore: true } }
  const searchTimeoutRef = useRef({});
  const [collapsedDays, setCollapsedDays] = useState([]);
  const dragMealRef = useRef(null); // { dayIndex, mealIndex }
  const [dragOverMeal, setDragOverMeal] = useState(null); // { dayIndex, mealIndex }

  // Fetch templates when view changes
  useEffect(() => {
    fetchTemplates();
  }, [view]);

  const fetchTemplates = async () => {
    try {
      setTemplatesLoading(true);
      setError(null);
      const response = await axios.get("/api/admin/nutritionist_diet_templates/list");
      if (response.data?.success) {
        setTemplates(response.data.data.templates || []);
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError("Failed to load templates");
    } finally {
      setTemplatesLoading(false);
    }
  };

  const initializeDietData = (days) => {
    const data = [];
    for (let i = 1; i <= days; i++) {
      data.push({
        day_number: i,
        meals: DEFAULT_MEALS.map(title => ({
          title: title,
          time: "",
          foods: [],
          isCustomTitle: false
        }))
      });
    }
    setDietData(data);
    setCompletedDays([]);
    setActiveDayTab(1);
  };

  // Migrate old format to new format for backwards compatibility
  const migrateOldFoodFormat = (food) => {
    // Old format: name_quantity field
    const nutrition = food.nutrition || {
      calories: 0, protein: 0, fat: 0, carbs: 0,
      fiber: 0, sugar: 0, sodium: 0, calcium: 0,
      iron: 0, magnesium: 0, potassium: 0
    };
    return {
      name: food.name_quantity || "",
      quantity: "",
      base_nutrition: { ...nutrition },
      nutrition: { ...nutrition }
    };
  };

  const migrateFoodFormat = (food) => {
    if (food.name && food.quantity !== undefined) {
      // Ensure base_nutrition is present for existing foods in new format
      if (!food.base_nutrition && food.nutrition) {
        const qty = parseFloat(food.quantity);
        if (!isNaN(qty) && qty > 0) {
          const base = {};
          Object.keys(food.nutrition).forEach(k => {
            base[k] = parseFloat(((food.nutrition[k] / qty) * 100).toFixed(2));
          });
          food.base_nutrition = base;
        } else {
          food.base_nutrition = { ...food.nutrition };
        }
      }
      return food;
    }
    return migrateOldFoodFormat(food);
  };

  const migrateDietData = (dietData) => {
    return dietData.map(day => ({
      ...day,
      meals: day.meals.map(meal => ({
        ...meal,
        isCustomTitle: meal.title && !MEAL_TYPES.includes(meal.title),
        foods: meal.foods.map(migrateFoodFormat)
      }))
    }));
  };

  const handleDaysChange = (e) => {
    const days = parseInt(e.target.value) || 0;
    setNumberOfDays(days);
    if (days > 0) {
      initializeDietData(days);
    } else {
      setDietData([]);
      setCompletedDays([]);
      setActiveDayTab(1);
    }
  };

  const addDay = () => {
    const newDayNumber = dietData.length + 1;
    const newDay = {
      day_number: newDayNumber,
      meals: DEFAULT_MEALS.map(title => ({
        title: title,
        time: "",
        foods: [],
        isCustomTitle: false
      }))
    };
    setDietData([...dietData, newDay]);
    setNumberOfDays(newDayNumber);
  };

  const removeDay = (dayIndex) => {
    const dayNumberToRemove = dietData[dayIndex].day_number;
    const newDietData = dietData.filter((_, index) => index !== dayIndex);
    const recalculatedData = newDietData.map((day, index) => ({
      ...day,
      day_number: index + 1
    }));
    setDietData(recalculatedData);
    setNumberOfDays(recalculatedData.length);
    
    // Adjust completedDays:
    setCompletedDays(prev => {
      const filtered = prev.filter(d => d !== dayNumberToRemove);
      return filtered.map(d => d > dayNumberToRemove ? d - 1 : d);
    });

    // Make sure active tab is still valid
    setActiveDayTab(prev => {
      if (prev >= recalculatedData.length) {
        return Math.max(1, recalculatedData.length);
      }
      return prev;
    });
  };

  const toggleDayCollapse = (dayNumber) => {
    setCollapsedDays(prev => 
      prev.includes(dayNumber) 
        ? prev.filter(d => d !== dayNumber) 
        : [...prev, dayNumber]
    );
  };

  const addMeal = (dayIndex) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals.push({
      title: "",
      time: "",
      foods: []
    });
    setDietData(newDietData);
  };

  const removeMeal = (dayIndex, mealIndex) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals.splice(mealIndex, 1);
    setDietData(newDietData);
  };

  const handleMealDragStart = (dayIndex, mealIndex) => {
    dragMealRef.current = { dayIndex, mealIndex };
  };

  const handleMealDragOver = (e, dayIndex, mealIndex) => {
    e.preventDefault();
    setDragOverMeal({ dayIndex, mealIndex });
  };

  const handleMealDrop = (e, dayIndex, mealIndex) => {
    e.preventDefault();
    const from = dragMealRef.current;
    if (!from || from.dayIndex !== dayIndex || from.mealIndex === mealIndex) {
      dragMealRef.current = null;
      setDragOverMeal(null);
      return;
    }
    const newDietData = [...dietData];
    const meals = [...newDietData[dayIndex].meals];
    const [moved] = meals.splice(from.mealIndex, 1);
    meals.splice(mealIndex, 0, moved);
    newDietData[dayIndex] = { ...newDietData[dayIndex], meals };
    setDietData(newDietData);
    dragMealRef.current = null;
    setDragOverMeal(null);
  };

  const handleMealDragEnd = () => {
    dragMealRef.current = null;
    setDragOverMeal(null);
  };

  const updateMeal = (dayIndex, mealIndex, field, value) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals[mealIndex][field] = value;
    setDietData(newDietData);
  };

  const handleTimePick = (dayIndex, mealIndex, timeValue) => {
    if (!timeValue) return;
    
    const [hours, minutes] = timeValue.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes, 0);
    
    const formatTime = (d) => {
      let h = d.getHours();
      let m = d.getMinutes();
      const ampm = h >= 12 ? 'PM' : 'AM';
      h = h % 12;
      h = h ? h : 12;
      const mStr = m < 10 ? `0${m}` : m;
      return `${h}:${mStr} ${ampm}`;
    };

    const startTime = formatTime(date);
    date.setMinutes(date.getMinutes() + 30);
    const endTime = formatTime(date);
    
    updateMeal(dayIndex, mealIndex, "time", `${startTime} - ${endTime}`);
  };

  const addFood = (dayIndex, mealIndex) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals[mealIndex].foods.push({
      name: "",
      quantity: "",
      nutrition: {
        calories: 0,
        protein: 0,
        fat: 0,
        carbs: 0,
        fiber: 0,
        sugar: 0,
        sodium: 0,
        calcium: 0,
        iron: 0,
        magnesium: 0,
        potassium: 0
      }
    });
    setDietData(newDietData);
  };

  const removeFood = (dayIndex, mealIndex, foodIndex) => {
    const newDietData = [...dietData];
    newDietData[dayIndex].meals[mealIndex].foods.splice(foodIndex, 1);
    setDietData(newDietData);
  };

  const updateFood = (dayIndex, mealIndex, foodIndex, field, value) => {
    const newDietData = [...dietData];
    const food = newDietData[dayIndex].meals[mealIndex].foods[foodIndex];
    
    if (field === "quantity") {
      food.quantity = value;
      // Recalculate nutrition proportionally if quantity is numeric
      const numericQty = parseFloat(value);
      if (!isNaN(numericQty) && food.base_nutrition && food.base_quantity) {
        Object.keys(food.base_nutrition).forEach(k => {
          const baseVal = food.base_nutrition[k] || 0;
          // Formula: (Nutrition Value / Base Quantity) * User Entered Quantity
          food.nutrition[k] = parseFloat(((baseVal / food.base_quantity) * numericQty).toFixed(2));
        });
      }
    } else if (field === "name") {
      food.name = value;
    } else {
      food.nutrition[field] = parseFloat(value) || 0;
    }
    setDietData(newDietData);
  };

  // Search foods for autocomplete with pagination
  const searchFoods = async (query, dayIndex, mealIndex, foodIndex, page = 1) => {
    const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
    if (!query || query.length < 1) {
      setFoodSuggestions(prev => ({ ...prev, [key]: [] }));
      setShowSuggestions(prev => ({ ...prev, [key]: false }));
      setFoodPagination(prev => ({ ...prev, [key]: { page: 1, hasMore: false } }));
      return;
    }

    setSearchingFood(prev => ({ ...prev, [key]: true }));

    try {
      const response = await axios.get(`/api/admin/nutritionist_diet_templates/food-search?query=${encodeURIComponent(query)}&page=${page}&limit=20`);
      if (response.data?.success) {
        const newFoods = response.data.data.foods || [];
        setFoodSuggestions(prev => ({ 
          ...prev, 
          [key]: page === 1 ? newFoods : [...(prev[key] || []), ...newFoods] 
        }));
        
        // If we got 20 items, there's likely more
        setFoodPagination(prev => ({ 
          ...prev, 
          [key]: { page: page, hasMore: newFoods.length === 20 } 
        }));
        
        setShowSuggestions(prev => ({ ...prev, [key]: true }));
      }
    } catch (err) {
      console.error("Error searching foods:", err);
    } finally {
      setSearchingFood(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSuggestionsScroll = (e, dayIndex, mealIndex, foodIndex) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) { // Near bottom
      const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
      const pagination = foodPagination[key];
      const food = dietData[dayIndex].meals[mealIndex].foods[foodIndex];
      const query = food.name || food.name_quantity || "";
      
      if (pagination && pagination.hasMore && !searchingFood[key]) {
        searchFoods(query, dayIndex, mealIndex, foodIndex, pagination.page + 1);
      }
    }
  };

  // Handle suggestion selection
  const selectFoodSuggestion = (suggestion, dayIndex, mealIndex, foodIndex) => {
    const newDietData = [...dietData];
    const baseNutrition = suggestion.nutrition || {
      calories: 0, protein: 0, fat: 0, carbs: 0,
      fiber: 0, sugar: 0, sodium: 0, calcium: 0,
      iron: 0, magnesium: 0, potassium: 0
    };
    
    const baseQty = suggestion.base_quantity || 100;
    const baseUnit = suggestion.base_unit || "g";
    const displayQty = suggestion.quantity || `${baseQty}${baseUnit}`;
    const numericQty = parseFloat(displayQty) || baseQty;

    const initialNutrition = {};
    Object.keys(baseNutrition).forEach(k => {
      initialNutrition[k] = parseFloat(((baseNutrition[k] / baseQty) * numericQty).toFixed(2));
    });

    newDietData[dayIndex].meals[mealIndex].foods[foodIndex] = {
      name: suggestion.name,
      quantity: displayQty,
      base_quantity: baseQty,
      base_unit: baseUnit,
      base_nutrition: { ...baseNutrition },
      nutrition: initialNutrition
    };
    setDietData(newDietData);

    const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
    setShowSuggestions(prev => ({ ...prev, [key]: false }));
    setFoodSuggestions(prev => ({ ...prev, [key]: [] }));
  };

  // Handle keyboard navigation in suggestions
  const handleSuggestionKeyDown = (e, suggestions, dayIndex, mealIndex, foodIndex) => {
    const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
    if (!suggestions || suggestions.length === 0) return;

    if (!activeSuggestionRef.current[key]) {
      activeSuggestionRef.current[key] = 0;
    }

    if (e.key === "ArrowDown") {
      e.preventDefault();
      activeSuggestionRef.current[key] = Math.min(activeSuggestionRef.current[key] + 1, suggestions.length - 1);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      activeSuggestionRef.current[key] = Math.max(activeSuggestionRef.current[key] - 1, 0);
    } else if (e.key === "Enter") {
      e.preventDefault();
      const activeIdx = activeSuggestionRef.current[key];
      if (suggestions[activeIdx]) {
        selectFoodSuggestion(suggestions[activeIdx], dayIndex, mealIndex, foodIndex);
      }
    } else if (e.key === "Escape") {
      setShowSuggestions(prev => ({ ...prev, [key]: false }));
    }
  };

  const handleSaveDay = async (dayNumber) => {
    if (!templateName.trim()) {
      alert("Please enter a template name first");
      return;
    }
    if (!sessionNo) {
      alert("Please select a session number");
      return;
    }
    if (!numberOfDays || numberOfDays < 1) {
      alert("Please enter number of days");
      return;
    }

    // Validate only this active day's diet data
    const day = dietData.find(d => d.day_number === dayNumber);
    if (!day) return;

    for (const meal of day.meals) {
      if (!meal.title.trim()) {
        alert(`Please enter a title for all meals on Day ${dayNumber}`);
        return;
      }
      for (const food of meal.foods) {
        if (!food.name?.trim()) {
          alert(`Please enter a food name for all foods in "${meal.title}" on Day ${dayNumber}`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      const payload = {
        template_name: templateName,
        number_of_days: parseInt(numberOfDays),
        description: description,
        session_no: sessionNo ? parseInt(sessionNo) : null,
        diet_data: dietData
      };

      let response;
      if (editingTemplate && editingTemplate.id) {
        response = await axios.put(`/api/admin/nutritionist_diet_templates/template/${editingTemplate.id}`, payload);
      } else {
        response = await axios.post("/api/admin/nutritionist_diet_templates/create", payload);
      }

      if (response.data?.success) {
        const savedTemplate = response.data.data;
        // On first save, update editingTemplate with the created template so we get its ID
        setEditingTemplate(savedTemplate);

        // Mark this day as completed
        setCompletedDays(prev => {
          if (prev.includes(dayNumber)) return prev;
          return [...prev, dayNumber];
        });

        alert(`Day ${dayNumber} saved successfully!`);

        // Unlock and go to next day if not the last day
        if (dayNumber < numberOfDays) {
          setActiveDayTab(dayNumber + 1);
        }
      }
    } catch (err) {
      console.error("Error saving day:", err);
      alert(err.response?.data?.detail || "Failed to save day data");
    } finally {
      setLoading(false);
    }
  };

  const handleFinishTemplate = async () => {
    if (!templateName.trim()) {
      alert("Please enter a template name first");
      return;
    }
    if (!sessionNo) {
      alert("Please select a session number");
      return;
    }
    if (!numberOfDays || numberOfDays < 1) {
      alert("Please enter number of days");
      return;
    }

    try {
      setLoading(true);
      const payload = {
        template_name: templateName,
        number_of_days: parseInt(numberOfDays),
        description: description,
        session_no: sessionNo ? parseInt(sessionNo) : null,
        diet_data: dietData
      };

      let response;
      if (editingTemplate && editingTemplate.id) {
        response = await axios.put(`/api/admin/nutritionist_diet_templates/template/${editingTemplate.id}`, payload);
      } else {
        response = await axios.post("/api/admin/nutritionist_diet_templates/create", payload);
      }

      if (response.data?.success) {
        alert("Template saved and finalized successfully!");
        resetForm();
        setView("list");
      }
    } catch (err) {
      console.error("Error finishing template:", err);
      alert(err.response?.data?.detail || "Failed to finalize template");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setTemplateName("");
    setNumberOfDays("");
    setDescription("");
    setSessionNo("");
    setDietData([]);
    setEditingTemplate(null);
    setCompletedDays([]);
    setActiveDayTab(1);
  };

  const handleEditTemplate = async (templateId, isVerified = false) => {
    try {
      setLoading(true);
      const url = isVerified
        ? `/api/admin/nutritionist_diet_templates/template/${templateId}?verified=true&for_edit=true`
        : `/api/admin/nutritionist_diet_templates/template/${templateId}?for_edit=true`;

      const response = await axios.get(url);
      
      if (response.data?.requires_verification) {
        // Trigger the secure authorization modal for editing
        handleDeleteTrigger(
          async () => {
            // Callback after successful verification
            await handleEditTemplate(templateId, true);
          },
          "Secure Edit Authorization",
          "Assigned to a client. Edit anyway?",
          "Verify & Edit"
        );
      } else if (response.data?.success) {
        const template = response.data.data;
        setTemplateName(template.template_name);
        setNumberOfDays(template.number_of_days);
        setDescription(template.description || "");
        setSessionNo(template.session_no ? template.session_no.toString() : "");
        const diet_data = migrateDietData(template.diet_data || []);
        setDietData(diet_data);
        setEditingTemplate(template);
        // Mark all existing days as completed initially so they are unlocked
        const allDays = diet_data.map(d => d.day_number);
        setCompletedDays(allDays);
        setActiveDayTab(1);
        setView("create");
      }
    } catch (err) {
      console.error("Error fetching template:", err);
      alert("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteTemplate = async (templateId, isVerified = false) => {
    if (!isVerified && !confirm("Are you sure you want to delete this template?")) {
      return;
    }

    try {
      setLoading(true);
      
      const url = isVerified 
        ? `/api/admin/nutritionist_diet_templates/template/${templateId}?verified=true`
        : `/api/admin/nutritionist_diet_templates/template/${templateId}`;

      const response = await axios.delete(url);
      
      if (response.data?.requires_verification) {
        // Trigger the secure authorization modal
        handleDeleteTrigger(async () => {
          // Callback after successful verification
          await handleDeleteTemplate(templateId, true);
        });
      } else if (response.data?.success) {
        alert("Template deleted successfully!");
        fetchTemplates();
      }
    } catch (err) {
      console.error("Error deleting template:", err);
      alert(err.response?.data?.detail || "Failed to delete template");
    } finally {
      setLoading(false);
    }
  };

  const handleViewTemplate = async (templateId) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/nutritionist_diet_templates/template/${templateId}`);
      if (response.data?.success && response.data?.data) {
        const data = response.data.data;
        const diet_data = migrateDietData(data.diet_data || []);
        setViewingTemplate({ ...data, diet_data });
        setCollapsedDays(diet_data.map(d => d.day_number));
      } else {
        alert(response.data?.message || "Failed to load template data");
      }
    } catch (err) {
      console.error("Error fetching template:", err);
      alert("Failed to load template");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyTemplate = async (templateId) => {
    // Check if there is existing content in the form
    const hasContent = templateName.trim() !== "" || description.trim() !== "" || dietData.length > 0;
    if (hasContent) {
      const confirmCopy = confirm("Copying this template will overwrite any name, instructions, or meal plan days you have currently entered. Do you want to proceed?");
      if (!confirmCopy) {
        return;
      }
    }

    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/nutritionist_diet_templates/template/${templateId}`);
      if (response.data?.success && response.data?.data) {
        const template = response.data.data;
        setTemplateName(`${template.template_name} (Copy)`);
        setNumberOfDays(template.number_of_days);
        setDescription(template.description || "");
        setSessionNo(template.session_no ? template.session_no.toString() : "");
        const diet_data = migrateDietData(template.diet_data || []);
        setDietData(diet_data);
        setEditingTemplate(null); // Set to null so saving creates a new template
        // Mark all existing days as completed initially so they are unlocked
        const allDays = diet_data.map(d => d.day_number);
        setCompletedDays(allDays);
        setActiveDayTab(1);
        setView("create");
      } else {
        alert(response.data?.message || "Failed to load template data for copying");
      }
    } catch (err) {
      console.error("Error copying template:", err);
      alert("Failed to copy template");
    } finally {
      setLoading(false);
    }
  };

  const closeViewer = () => {
    setViewingTemplate(null);
    setView("list");
  };

  return (
    <div className="users-container">
      <div className="users-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h2 className="users-title">
          <span style={{ color: "#10b981" }}>Create</span> Template
        </h2>
        <div style={{ display: "flex", gap: "1rem" }}>
          <button
            onClick={() => {
              setView("create");
              resetForm();
            }}
            style={{
              background: view === "create" ? "#10b981" : "transparent",
              border: view === "create" ? "none" : "1px solid #d1d5db",
              color: view === "create" ? "white" : "#4b5563",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600"
            }}
          >
            Create New
          </button>
          <button
            onClick={() => setView("list")}
            style={{
              background: view === "list" ? "#10b981" : "transparent",
              border: view === "list" ? "none" : "1px solid #d1d5db",
              color: view === "list" ? "white" : "#4b5563",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600"
            }}
          >
            My Templates
          </button>
        </div>
      </div>

      {view === "list" ? (
        <div className="table-container">
          {templatesLoading ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
              Loading templates...
            </div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: "center", padding: "2rem", color: "#999" }}>
              No templates found. Create your first template!
            </div>
          ) : (
            <div className="table-responsive">
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Template Name</th>
                    <th>Session No.</th>
                    <th>Days</th>
                    <th>Instructions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {templates.map((template) => (
                    <tr key={template.id}>
                      <td>{template.template_name}</td>
                      <td>{template.session_no ? `Session ${template.session_no}` : "-"}</td>
                      <td>{template.number_of_days}</td>
                      <td>{template.description || "-"}</td>
                      <td>
                        <button
                          onClick={() => handleViewTemplate(template.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #10b981",
                            color: "#10b981",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginRight: "8px",
                          }}
                        >
                          View
                        </button>
                        <button
                          onClick={() => handleEditTemplate(template.id)}
                          style={{
                            background: "transparent",
                            border: "1px solid #3b82f6",
                            color: "#3b82f6",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: "pointer",
                            fontSize: "12px",
                            marginRight: "8px",
                          }}
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          disabled={template.is_assigned}
                          style={{
                            background: template.is_assigned ? "#f3f4f6" : "transparent",
                            border: template.is_assigned ? "1px solid #e5e7eb" : "1px solid #f44",
                            color: template.is_assigned ? "#9ca3af" : "#f44",
                            padding: "4px 12px",
                            borderRadius: "4px",
                            cursor: template.is_assigned ? "not-allowed" : "pointer",
                            fontSize: "12px",
                          }}
                          title={template.is_assigned ? "This template is currently assigned to a client and cannot be deleted." : ""}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : (
        <div style={{ background: "#ffffff", border: "1px solid #e5e7eb", borderRadius: "8px", padding: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.1)" }}>
          {/* Copy from Existing Template Selector */}
          {!editingTemplate && (
            <div style={{ marginBottom: "1rem", paddingBottom: "1rem", borderBottom: "1px solid #f3f4f6" }}>
              <label style={{ display: "block", color: "#374151", fontSize: "12px", marginBottom: "0.4rem", fontWeight: "600" }}>
                Copy From Existing Template
              </label>
              <div ref={copyDropdownRef} style={{ position: "relative", width: "100%", maxWidth: "280px" }}>
                <input
                  type="text"
                  placeholder="Search & select template to copy..."
                  value={copySearchQuery}
                  onChange={(e) => {
                    setCopySearchQuery(e.target.value);
                    setShowCopyDropdown(true);
                  }}
                  onFocus={() => setShowCopyDropdown(true)}
                  style={{
                    width: "100%",
                    background: "#f9fafb",
                    border: "1px solid #d1d5db",
                    color: "#111827",
                    padding: "8px 12px",
                    borderRadius: "6px",
                    fontSize: "13px",
                    outline: "none"
                  }}
                />
                <div style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#6b7280",
                  pointerEvents: "none",
                  fontSize: "10px"
                }}>
                  ▼
                </div>

                {showCopyDropdown && (
                  <div style={{
                    position: "absolute",
                    top: "100%",
                    left: 0,
                    right: 0,
                    background: "#ffffff",
                    border: "1px solid #d1d5db",
                    borderRadius: "6px",
                    maxHeight: "200px",
                    overflowY: "auto",
                    zIndex: 1000,
                    marginTop: "4px",
                    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                  }}>
                    {(() => {
                      const filtered = templates.filter(t => 
                        t.template_name.toLowerCase().includes(copySearchQuery.toLowerCase()) ||
                        (t.session_no && `session ${t.session_no}`.includes(copySearchQuery.toLowerCase()))
                      );

                      if (filtered.length === 0) {
                        return (
                          <div style={{ padding: "8px 10px", color: "#9ca3af", fontSize: "12px", textAlign: "center" }}>
                            No templates found
                          </div>
                        );
                      }

                      return filtered.map(t => (
                        <div
                          key={t.id}
                          onClick={() => {
                            handleCopyTemplate(t.id);
                            setCopySearchQuery("");
                            setShowCopyDropdown(false);
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.background = "#f3f4f6"}
                          onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
                          style={{
                            padding: "8px 10px",
                            cursor: "pointer",
                            color: "#111827",
                            fontSize: "12px",
                            borderBottom: "1px solid #e5e7eb",
                            textAlign: "left"
                          }}
                        >
                          <strong style={{ color: "#111827" }}>{t.template_name}</strong>
                          <div style={{ fontSize: "10px", color: "#6b7280" }}>
                            {t.session_no ? `Session ${t.session_no} • ` : ""}{t.number_of_days} Days
                          </div>
                        </div>
                      ));
                    })()}
                  </div>
                )}
              </div>
            </div>
          )}
          {/* Template Basic Info */}
          <div style={{ marginBottom: "2rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", color: "#374151", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "500" }}>
                Template Name *
              </label>
              <input
                type="text"
                value={templateName}
                onChange={(e) => setTemplateName(e.target.value)}
                placeholder="e.g., Weight Lose, Muscle Gain"
                style={{
                  width: "100%",
                  background: "#f9fafb",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#374151", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "500" }}>
                Session Number *
              </label>
              <select
                value={sessionNo}
                onChange={(e) => setSessionNo(e.target.value)}
                style={{
                  width: "100%",
                  background: "#f9fafb",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  height: "38px",
                  outline: "none",
                  cursor: "pointer"
                }}
              >
                <option value="">Select session number</option>
                {Array.from({ length: 12 }, (_, i) => i + 1).map(num => (
                  <option key={num} value={num.toString()}>Session {num}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={{ display: "block", color: "#374151", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "500" }}>
                Number of Days *
              </label>
              <input
                type="number"
                value={numberOfDays}
                onChange={handleDaysChange}
                min="1"
                placeholder="e.g., 7, 14, 30"
                style={{
                  width: "100%",
                  background: "#f9fafb",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                }}
              />
            </div>
            <div>
              <label style={{ display: "block", color: "#374151", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "500" }}>
                Instructions (Optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Brief instructions..."
                rows={1}
                style={{
                  width: "100%",
                  minHeight: "38px",
                  background: "#f9fafb",
                  border: "1px solid #d1d5db",
                  color: "#111827",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  fontSize: "14px",
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              />
            </div>
          </div>

          {/* Diet Data Builder */}
          {dietData.length > 0 && (
            <div>
              <h3 style={{ color: "#111827", fontSize: "16px", marginBottom: "1rem", fontWeight: "700" }}>Meal Plan</h3>
              
              {/* Horizontal Day Tabs */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginBottom: "24px" }}>
                {dietData.map((day, dayIndex) => {
                  const dayNum = day.day_number;
                  const isCompleted = completedDays.includes(dayNum);
                  const isUnlocked = dayNum === 1 || completedDays.includes(dayNum - 1) || completedDays.includes(dayNum);
                  const isActive = activeDayTab === dayNum;

                  let bg = "#f3f4f6"; // Locked default
                  let border = "1px solid #e5e7eb";
                  let color = "#9ca3af";
                  let cursor = "not-allowed";
                  let icon = <FaLock size={12} style={{ color: "#9ca3af" }} />;

                  if (isActive) {
                    bg = "#10b981"; // Active green
                    border = "1px solid #10b981";
                    color = "#ffffff";
                    cursor = "pointer";
                    icon = isCompleted ? <FaCheck size={12} style={{ color: "#ffffff" }} /> : null;
                  } else if (isCompleted) {
                    bg = "#e6f4ea"; // Completed soft green
                    border = "1px solid #a7f3d0";
                    color = "#047857";
                    cursor = "pointer";
                    icon = <FaCheck size={12} style={{ color: "#047857" }} />;
                  } else if (isUnlocked) {
                    bg = "#ffffff"; // Unlocked/Unsaved white
                    border = "1px solid #cbd5e1";
                    color = "#334155";
                    cursor = "pointer";
                    icon = null;
                  }

                  return (
                    <div
                      key={dayNum}
                      style={{
                        position: "relative",
                        display: "flex",
                        alignItems: "center",
                        background: bg,
                        border: border,
                        color: color,
                        borderRadius: "8px",
                        padding: "10px 16px",
                        boxShadow: isActive ? "0 4px 6px -1px rgba(16, 185, 129, 0.2)" : "none",
                        transform: isActive ? "translateY(-1px)" : "none",
                        transition: "all 0.2s ease"
                      }}
                    >
                      <span
                        onClick={() => {
                          if (isUnlocked) {
                            setActiveDayTab(dayNum);
                          }
                        }}
                        style={{
                          cursor: cursor,
                          fontSize: "13px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          userSelect: "none"
                        }}
                      >
                        Day {dayNum}
                        {icon}
                      </span>

                      {dayNum > 1 && (
                        <span
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to remove Day ${dayNum}?`)) {
                              removeDay(dayIndex);
                            }
                          }}
                          style={{
                            position: "absolute",
                            top: "-6px",
                            right: "-6px",
                            cursor: "pointer",
                            background: "#ef4444",
                            color: "white",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            width: "16px",
                            height: "16px",
                            borderRadius: "50%",
                            fontSize: "8px",
                            fontWeight: "bold",
                            border: "1px solid #ffffff",
                            boxShadow: "0 1px 3px rgba(0,0,0,0.15)",
                            transition: "all 0.2s"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "#dc2626";
                            e.currentTarget.style.transform = "scale(1.1)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "#ef4444";
                            e.currentTarget.style.transform = "scale(1)";
                          }}
                          title={`Remove Day ${dayNum}`}
                        >
                          <FaTimes size={8} />
                        </span>
                      )}
                    </div>
                  );
                })}
                <button
                  onClick={addDay}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background: "transparent",
                    border: "1px dashed #10b981",
                    color: "#059669",
                    padding: "10px 16px",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "700",
                    transition: "all 0.2s ease"
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#e6f4ea";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "transparent";
                  }}
                >
                  + Add Day
                </button>
              </div>

              {(() => {
                const day = dietData.find(d => d.day_number === activeDayTab);
                if (!day) return null;
                const dayIndex = dietData.findIndex(d => d.day_number === activeDayTab);

                return (
                  <div
                    key={day.day_number}
                    style={{ marginBottom: "2rem", background: "#f9fafb", borderRadius: "8px", padding: "1.5rem", border: "1px solid #e5e7eb" }}
                  >
                    <div
                      style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}
                    >
                      <h4 style={{ color: "#10b981", fontSize: "14px", margin: 0, fontWeight: "700" }}>
                        Day {day.day_number} Details
                      </h4>
                      <button
                        onClick={() => removeDay(dayIndex)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#f44",
                          cursor: "pointer",
                          fontSize: "14px",
                        }}
                      >
                        <FaTrash /> Remove Day
                      </button>
                    </div>

                    {day.meals.length === 0 ? (
                      <div style={{ textAlign: "center", padding: "1rem", color: "#999" }}>
                        No meals added yet.
                      </div>
                    ) : (
                      day.meals.map((meal, mealIndex) => (
                        <div
                          key={mealIndex}
                          draggable
                          onDragStart={() => handleMealDragStart(dayIndex, mealIndex)}
                          onDragOver={(e) => handleMealDragOver(e, dayIndex, mealIndex)}
                          onDrop={(e) => handleMealDrop(e, dayIndex, mealIndex)}
                          onDragEnd={handleMealDragEnd}
                          style={{
                            marginBottom: "1rem",
                            background: "#ffffff",
                            borderRadius: "8px",
                            padding: "1.25rem",
                            border: dragOverMeal && dragOverMeal.dayIndex === dayIndex && dragOverMeal.mealIndex === mealIndex
                              ? "2px solid #10b981"
                              : "1px solid #e5e7eb",
                            opacity: dragMealRef.current && dragMealRef.current.dayIndex === dayIndex && dragMealRef.current.mealIndex === mealIndex ? 0.5 : 1,
                            transition: "border 0.15s ease",
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <span
                                style={{ cursor: "grab", color: "#9ca3af", display: "flex", alignItems: "center" }}
                                onMouseDown={(e) => e.stopPropagation()}
                                title="Drag to reorder"
                              >
                                <FaGripVertical />
                              </span>
                              <span style={{ color: "#111827", fontSize: "13px", fontWeight: "700" }}>
                                Meal {mealIndex + 1}
                              </span>
                            </div>
                            <button
                              onClick={() => removeMeal(dayIndex, mealIndex)}
                              style={{
                                background: "transparent",
                                border: "none",
                                color: "#f44",
                                cursor: "pointer",
                                fontSize: "12px",
                              }}
                            >
                              <FaTrash />
                            </button>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                            <div>
                              <label style={{ display: "block", color: "#4b5563", fontSize: "12px", marginBottom: "0.25rem", fontWeight: "500" }}>
                                Title *
                              </label>
                              {!meal.isCustomTitle && (MEAL_TYPES.includes(meal.title) || meal.title === "") ? (
                                <select
                                  value={meal.title}
                                  onChange={(e) => {
                                    if (e.target.value === "Others") {
                                      const newDietData = [...dietData];
                                      newDietData[dayIndex].meals[mealIndex].isCustomTitle = true;
                                      newDietData[dayIndex].meals[mealIndex].title = "";
                                      setDietData(newDietData);
                                    } else {
                                      updateMeal(dayIndex, mealIndex, "title", e.target.value);
                                    }
                                  }}
                                  style={{
                                    width: "100%",
                                    background: "#f9fafb",
                                    border: "1px solid #d1d5db",
                                    color: "#111827",
                                    padding: "6px 10px",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    outline: "none",
                                    cursor: "pointer"
                                  }}
                                >
                                  <option value="">Select Meal Type</option>
                                  {MEAL_TYPES.map(type => (
                                    <option key={type} value={type}>{type}</option>
                                  ))}
                                  <option value="Others">Others</option>
                                </select>
                              ) : (
                                <div style={{ position: "relative" }}>
                                  <input
                                    type="text"
                                    value={meal.title}
                                    onChange={(e) => updateMeal(dayIndex, mealIndex, "title", e.target.value)}
                                    placeholder="Enter custom title"
                                    style={{
                                      width: "100%",
                                      background: "#f9fafb",
                                      border: "1px solid #d1d5db",
                                      color: "#111827",
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      fontSize: "13px",
                                      paddingRight: "30px",
                                      outline: "none"
                                    }}
                                    autoFocus
                                  />
                                  <button
                                    onClick={() => {
                                      const newDietData = [...dietData];
                                      newDietData[dayIndex].meals[mealIndex].isCustomTitle = false;
                                      newDietData[dayIndex].meals[mealIndex].title = "";
                                      setDietData(newDietData);
                                    }}
                                    style={{
                                      position: "absolute",
                                      right: "8px",
                                      top: "50%",
                                      transform: "translateY(-50%)",
                                      background: "transparent",
                                      border: "none",
                                      color: "#9ca3af",
                                      cursor: "pointer",
                                      display: "flex",
                                      alignItems: "center",
                                      padding: "2px"
                                    }}
                                    title="Back to predefined list"
                                  >
                                    <FaTimes size={12} />
                                  </button>
                                </div>
                              )}
                            </div>
                            <div>
                              <label style={{ display: "block", color: "#4b5563", fontSize: "12px", marginBottom: "0.25rem", fontWeight: "500" }}>
                                Time *
                              </label>
                              <div style={{ position: "relative" }}>
                                <input
                                  type="text"
                                  value={meal.time}
                                  onChange={(e) => updateMeal(dayIndex, mealIndex, "time", e.target.value)}
                                  placeholder="e.g., 6:30-7:00 AM"
                                  style={{
                                    width: "100%",
                                    background: "#f9fafb",
                                    border: "1px solid #d1d5db",
                                    color: "#111827",
                                    padding: "6px 10px",
                                    paddingRight: "35px",
                                    borderRadius: "6px",
                                    fontSize: "13px",
                                    outline: "none"
                                  }}
                                />
                                <div style={{
                                  position: "absolute",
                                  right: "0",
                                  top: "0",
                                  bottom: "0",
                                  width: "40px",
                                  display: "flex",
                                  justifyContent: "center",
                                  alignItems: "center",
                                  cursor: "pointer",
                                  color: "#10b981"
                                }}>
                                  <FaClock size={14} />
                                  <input
                                    type="time"
                                    onChange={(e) => handleTimePick(dayIndex, mealIndex, e.target.value)}
                                    style={{
                                      position: "absolute",
                                      opacity: 0,
                                      width: "100%",
                                      height: "100%",
                                      cursor: "pointer",
                                      left: 0,
                                      top: 0
                                    }}
                                  />
                                </div>
                              </div>
                            </div>
                          </div>

                          {meal.foods.map((food, foodIndex) => (
                            <div key={foodIndex} style={{ marginBottom: "0.5rem", background: "#f9fafb", borderRadius: "8px", padding: "1rem", border: "1px solid #e5e7eb" }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                                <span style={{ color: "#6b7280", fontSize: "11px", fontWeight: "600" }}>Food {foodIndex + 1}</span>
                                <button
                                  onClick={() => removeFood(dayIndex, mealIndex, foodIndex)}
                                  style={{
                                    background: "transparent",
                                    border: "none",
                                    color: "#f44",
                                    cursor: "pointer",
                                    fontSize: "11px",
                                  }}
                                >
                                  <FaTimes />
                                </button>
                              </div>

                              <div style={{ marginBottom: "0.5rem", display: "grid", gridTemplateColumns: "1fr 80px", gap: "0.5rem" }}>
                                <div style={{ position: "relative" }}>
                                  <input
                                    type="text"
                                    value={food.name || food.name_quantity || ""}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateFood(dayIndex, mealIndex, foodIndex, "name", val);
                                      
                                      const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
                                      if (searchTimeoutRef.current[key]) {
                                        clearTimeout(searchTimeoutRef.current[key]);
                                      }
                                      
                                      searchTimeoutRef.current[key] = setTimeout(() => {
                                        searchFoods(val, dayIndex, mealIndex, foodIndex, 1);
                                      }, 300);
                                    }}
                                    onKeyDown={(e) => {
                                      const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
                                      handleSuggestionKeyDown(e, foodSuggestions[key] || [], dayIndex, mealIndex, foodIndex);
                                    }}
                                    onBlur={() => {
                                      setTimeout(() => {
                                        const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
                                        setShowSuggestions(prev => ({ ...prev, [key]: false }));
                                      }, 200);
                                    }}
                                    placeholder="Food name"
                                    style={{
                                      width: "100%",
                                      background: "#ffffff",
                                      border: "1px solid #d1d5db",
                                      color: "#111827",
                                      padding: "6px 10px",
                                      borderRadius: "6px",
                                      fontSize: "12px",
                                    }}
                                  />
                                  {(() => {
                                    const key = `${dayIndex}-${mealIndex}-${foodIndex}`;
                                    const suggestions = foodSuggestions[key] || [];
                                    const isOpen = showSuggestions[key] && suggestions.length > 0;
                                    if (isOpen) {
                                      return (
                                        <div style={{
                                          position: "absolute",
                                          top: "100%",
                                          left: 0,
                                          right: 0,
                                          background: "#ffffff",
                                          border: "1px solid #d1d5db",
                                          borderRadius: "6px",
                                          maxHeight: "200px",
                                          overflowY: "auto",
                                          zIndex: 1000,
                                          marginTop: "4px",
                                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)"
                                        }}
                                        onScroll={(e) => handleSuggestionsScroll(e, dayIndex, mealIndex, foodIndex)}
                                        >
                                          {suggestions.map((s, idx) => (
                                            <div
                                              key={s.id}
                                              onMouseDown={(e) => {
                                                e.preventDefault();
                                                selectFoodSuggestion(s, dayIndex, mealIndex, foodIndex);
                                              }}
                                              style={{
                                                padding: "8px 10px",
                                                cursor: "pointer",
                                                background: activeSuggestionRef.current[key] === idx ? "#f3f4f6" : "transparent",
                                                color: "#111827",
                                                fontSize: "12px",
                                                borderBottom: "1px solid #e5e7eb"
                                              }}
                                            >
                                              <div style={{ fontWeight: 600, color: "#111827" }}>{s.name}</div>
                                              <div style={{ fontSize: "10px", color: "#6b7280" }}>Cal: {s.nutrition?.calories || 0} | P: {s.nutrition?.protein || 0}g | C: {s.nutrition?.carbs || 0}g</div>
                                            </div>
                                          ))}
                                          {searchingFood[key] && (
                                            <div style={{ padding: "8px 10px", textAlign: "center", fontSize: "11px", color: "#6b7280", background: "#f9fafb" }}>
                                              Loading more...
                                            </div>
                                          )}
                                        </div>
                                      );
                                    }
                                    return null;
                                  })()}
                                </div>
                                <input
                                  type="text"
                                  value={food.quantity || ""}
                                  onChange={(e) => updateFood(dayIndex, mealIndex, foodIndex, "quantity", e.target.value)}
                                  placeholder="e.g., 2 cups"
                                  style={{
                                    width: "100%",
                                    background: "#ffffff",
                                    border: "1px solid #d1d5db",
                                    color: "#111827",
                                    padding: "6px 10px",
                                    borderRadius: "4px",
                                    fontSize: "12px",
                                  }}
                                />
                              </div>

                              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(80px, 1fr))", gap: "0.5rem" }}>
                                {Object.keys(food.nutrition).map((nutrient) => (
                                  <div key={nutrient}>
                                    <label style={{ display: "block", color: "#6b7280", fontSize: "10px", marginBottom: "0.25rem", fontWeight: "600" }}>
                                      {nutrient}
                                    </label>
                                    <input
                                      type="text"
                                      value={food.nutrition[nutrient] === 0 ? "" : food.nutrition[nutrient]}
                                      onChange={(e) => updateFood(dayIndex, mealIndex, foodIndex, nutrient, e.target.value === "" ? 0 : parseFloat(e.target.value) || 0)}
                                      style={{
                                        width: "100%",
                                        background: "#ffffff",
                                        border: "1px solid #d1d5db",
                                        color: "#111827",
                                        padding: "4px 6px",
                                        borderRadius: "4px",
                                        fontSize: "11px",
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          ))}

                          <button
                            onClick={() => addFood(dayIndex, mealIndex)}
                            style={{
                              background: "transparent",
                              border: "1px dashed #10b981",
                              color: "#059669",
                              padding: "6px 12px",
                              borderRadius: "6px",
                              cursor: "pointer",
                              fontSize: "12px",
                              width: "100%",
                              fontWeight: "600"
                            }}
                          >
                            + Add Food
                          </button>
                        </div>
                      ))
                    )}

                    <button
                      onClick={() => addMeal(dayIndex)}
                      style={{
                        background: "#10b981",
                        border: "none",
                        color: "white",
                        padding: "8px 16px",
                        borderRadius: "6px",
                        cursor: "pointer",
                        fontSize: "13px",
                        fontWeight: "600"
                      }}
                    >
                      + Add Meal
                    </button>
                  </div>
                );
              })()}

              {/* Add Day Button */}
              <div style={{ textAlign: "center", marginTop: "1rem" }}>
                <button
                  onClick={addDay}
                  style={{
                    background: "#10b981",
                    border: "none",
                    color: "white",
                    padding: "10px 24px",
                    borderRadius: "6px",
                    cursor: "pointer",
                    fontSize: "14px",
                    fontWeight: "600"
                  }}
                >
                  + Add Day
                </button>
              </div>

              {/* Day Save Action Footer */}
              <div style={{ marginTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "1.5rem", borderTop: "1px solid #e5e7eb" }}>
                <div>
                  <button
                    onClick={resetForm}
                    style={{
                      background: "transparent",
                      border: "1px solid #d1d5db",
                      color: "#4b5563",
                      padding: "10px 20px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      fontSize: "14px",
                      fontWeight: "600"
                    }}
                  >
                    Cancel & Reset
                  </button>
                </div>
                <div style={{ display: "flex", gap: "12px" }}>
                  {completedDays.length === numberOfDays && (
                    <button
                      onClick={handleFinishTemplate}
                      disabled={loading}
                      style={{
                        background: "#3b82f6",
                        border: "none",
                        color: "white",
                        padding: "10px 20px",
                        borderRadius: "6px",
                        cursor: loading ? "not-allowed" : "pointer",
                        fontSize: "14px",
                        fontWeight: "600",
                        opacity: loading ? 0.6 : 1,
                        boxShadow: "0 4px 6px -1px rgba(59, 130, 246, 0.2)"
                      }}
                    >
                      Finish Template
                    </button>
                  )}
                  <button
                    onClick={() => handleSaveDay(activeDayTab)}
                    disabled={loading}
                    style={{
                      background: "#10b981",
                      border: "none",
                      color: "white",
                      padding: "10px 24px",
                      borderRadius: "6px",
                      cursor: loading ? "not-allowed" : "pointer",
                      fontSize: "14px",
                      opacity: loading ? 0.6 : 1,
                      fontWeight: "600",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                      boxShadow: "0 4px 6px -1px rgba(16, 185, 129, 0.2)"
                    }}
                  >
                    {loading ? "Saving..." : <><FaSave /> Save Day {activeDayTab}</>}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* View Template Modal */}
      {viewingTemplate && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
          }}
          onClick={closeViewer}
        >
          <div
            style={{
              background: "#ffffff",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              padding: "2rem",
              minWidth: "800px",
              maxWidth: "900px",
              maxHeight: "80vh",
              overflow: "auto",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h3 style={{ color: "#111827", fontSize: "20px", fontWeight: "700", margin: 0 }}>
                {viewingTemplate.template_name}
              </h3>
              <button
                onClick={closeViewer}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#6b7280",
                  cursor: "pointer",
                  fontSize: "20px",
                }}
              >
                <FaTimes />
              </button>
            </div>

            <div style={{ marginBottom: "1rem", display: "flex", gap: "2rem" }}>
              <span style={{ color: "#4b5563", fontSize: "13px" }}>
                <strong style={{ color: "#111827" }}>Days:</strong> {viewingTemplate.number_of_days}
              </span>
              {viewingTemplate.session_no && (
                <span style={{ color: "#4b5563", fontSize: "13px" }}>
                  <strong style={{ color: "#111827" }}>Session No:</strong> Session {viewingTemplate.session_no}
                </span>
              )}
              {viewingTemplate.description && (
                <span style={{ color: "#4b5563", fontSize: "13px" }}>
                  <strong style={{ color: "#111827" }}>Instructions:</strong> {viewingTemplate.description}
                </span>
              )}
            </div>

            <div style={{ marginTop: "1.5rem" }}>
              {viewingTemplate.diet_data && viewingTemplate.diet_data.map((day) => (
                <div
                  key={day.day_number}
                  style={{
                    marginBottom: "1.5rem",
                    padding: "1rem",
                  }}
                >
                  <h4 style={{ color: "#10b981", fontSize: "15px", fontWeight: "700", marginBottom: "1rem", margin: 0 }}>
                    Day {day.day_number}
                  </h4>

                  {day.meals && day.meals.map((meal, mealIndex) => (
                    <div
                      key={mealIndex}
                      style={{
                        marginBottom: "1rem",
                        padding: "0.75rem",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem", borderBottom: "1px solid #f3f4f6", paddingBottom: "4px" }}>
                        <span style={{ color: "#111827", fontSize: "14px", fontWeight: "700" }}>
                          {meal.title}
                        </span>
                        <span style={{ color: "#6b7280", fontSize: "12px", fontWeight: "500" }}>{meal.time}</span>
                      </div>

                      {meal.foods && meal.foods.map((food, foodIndex) => (
                        <div
                          key={foodIndex}
                          style={{
                            marginTop: "0.5rem",
                            padding: "0.5rem",
                          }}
                        >
                          <div style={{ color: "#374151", fontSize: "13px", marginBottom: "0.5rem", fontWeight: "600" }}>
                            {food.name || food.name_quantity}
                            {(food.quantity !== undefined && food.quantity !== null && food.quantity !== "") ? ` (Qty: ${food.quantity})` : ""}
                          </div>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "12px", color: "#6b7280" }}>
                            <span>Cal: <strong style={{ color: "#111827" }}>{food.nutrition?.calories || 0}</strong></span>
                            <span>Protein: <strong style={{ color: "#111827" }}>{food.nutrition?.protein || 0}g</strong></span>
                            <span>Fat: <strong style={{ color: "#111827" }}>{food.nutrition?.fat || 0}g</strong></span>
                            <span>Carbs: <strong style={{ color: "#111827" }}>{food.nutrition?.carbs || 0}g</strong></span>
                            <span>Fiber: {food.nutrition?.fiber || 0}g</span>
                            <span>Sugar: {food.nutrition?.sugar || 0}g</span>
                            <span>Sodium: {food.nutrition?.sodium || 0}mg</span>
                            <span>Calcium: {food.nutrition?.calcium || 0}mg</span>
                            <span>Iron: {food.nutrition?.iron || 0}mg</span>
                            <span>Magnesium: {food.nutrition?.magnesium || 0}mg</span>
                            <span>Potassium: {food.nutrition?.potassium || 0}mg</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              ))}
            </div>

            <div style={{ marginTop: "1.5rem", textAlign: "right" }}>
              <button
                onClick={closeViewer}
                style={{
                  background: "#10b981",
                  border: "none",
                  color: "white",
                  padding: "8px 20px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "13px",
                  fontWeight: "600"
                }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Secure Delete Verification Modal */}
      <SecureDeleteModal {...secureDeleteProps} />
    </div>
  );
}

export default function CreateTemplate() {
  return (
    <Suspense fallback={<div className="users-container" style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "50vh", color: "#10b981", fontSize: "18px" }}>Loading template builder...</div>}>
      <CreateTemplateContent />
    </Suspense>
  );
}
