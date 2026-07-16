"use client";
import React, { useState, useEffect, useRef } from "react";
import { FaPlus, FaSearch, FaEdit, FaSave, FaTimes, FaChevronLeft, FaChevronRight } from "react-icons/fa";
import axios from "@/lib/axios";

export default function FoodCollections() {
  const [foods, setFoods] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filtering and Pagination
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalRecords, setTotalRecords] = useState(0);
  const limit = 100;

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [modalData, setModalData] = useState({
    item: "",
    categories: "",
    quantity: "100g",
    calories: 0,
    protein: 0,
    carbs: 0,
    fat: 0,
    fiber: 0,
    sugar: 0,
    sodium: 0,
    calcium: 0,
    iron: 0,
    magnesium: 0,
    potassium: 0,
    pic: ""
  });

  const searchTimeout = useRef(null);

  useEffect(() => {
    fetchCategories();
  }, []);

  useEffect(() => {
    // Debounce search
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      fetchFoods();
    }, 500);
    return () => clearTimeout(searchTimeout.current);
  }, [search, selectedCategory, page]);

  const fetchCategories = async () => {
    try {
      const response = await axios.get("/api/admin/nutritionist_food_collections/categories");
      if (response.data?.success) {
        setCategories(response.data.data);
      }
    } catch (err) {
      console.error("Error fetching categories:", err);
    }
  };

  const fetchFoods = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/admin/nutritionist_food_collections/list", {
        params: {
          page,
          limit,
          search,
          category: selectedCategory || undefined
        }
      });
      if (response.data?.success) {
        setFoods(response.data.data.foods);
        setTotalPages(response.data.data.pages);
        setTotalRecords(response.data.data.total);
      }
    } catch (err) {
      console.error("Error fetching foods:", err);
      setError("Failed to load foods");
    } finally {
      setLoading(false);
    }
  };

  const handleAddFood = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post("/api/admin/nutritionist_food_collections/add", modalData);
      if (response.data?.success) {
        alert("Food added successfully!");
        setShowAddModal(false);
        resetModal();
        fetchFoods();
        fetchCategories(); // Refresh categories in case a new one was added
      }
    } catch (err) {
      console.error("Error adding food:", err);
      alert("Failed to add food");
    }
  };

  const handleEditFood = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.put(`/api/admin/nutritionist_food_collections/edit/${editingFood.id}`, modalData);
      if (response.data?.success) {
        alert("Food updated successfully!");
        setShowEditModal(false);
        resetModal();
        fetchFoods();
      }
    } catch (err) {
      console.error("Error editing food:", err);
      alert("Failed to update food");
    }
  };

  const openEditModal = (food) => {
    setEditingFood(food);
    setModalData({
      item: food.item,
      categories: food.categories,
      quantity: food.quantity,
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      fiber: food.fiber,
      sugar: food.sugar,
      sodium: food.sodium || 0,
      calcium: food.calcium || 0,
      iron: food.iron || 0,
      magnesium: food.magnesium || 0,
      potassium: food.potassium || 0,
      pic: food.pic || ""
    });
    setShowEditModal(true);
  };

  const resetModal = () => {
    setModalData({
      item: "",
      categories: "",
      quantity: "100g",
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      sugar: 0,
      sodium: 0,
      calcium: 0,
      iron: 0,
      magnesium: 0,
      potassium: 0,
      pic: ""
    });
    setEditingFood(null);
  };

  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "10px", marginTop: "2rem" }}>
        <button
          onClick={() => setPage(p => Math.max(1, p - 1))}
          disabled={page === 1}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: page === 1 ? "1px solid #d1d5db" : "none",
            background: page === 1 ? "#f3f4f6" : "#10b981",
            color: page === 1 ? "#9ca3af" : "#ffffff",
            cursor: page === 1 ? "not-allowed" : "pointer"
          }}
        >
          <FaChevronLeft />
        </button>
        
        <span style={{ fontSize: "14px", fontWeight: "600", color: "#374151" }}>
          Page {page} of {totalPages}
        </span>

        <button
          onClick={() => setPage(p => Math.min(totalPages, p + 1))}
          disabled={page === totalPages}
          style={{
            padding: "8px 12px",
            borderRadius: "6px",
            border: page === totalPages ? "1px solid #d1d5db" : "none",
            background: page === totalPages ? "#f3f4f6" : "#10b981",
            color: page === totalPages ? "#9ca3af" : "#ffffff",
            cursor: page === totalPages ? "not-allowed" : "pointer"
          }}
        >
          <FaChevronRight />
        </button>
      </div>
    );
  };

  return (
    <div style={{ padding: "0.5rem 1rem 2rem 1rem", backgroundColor: "#f9fafb", minHeight: "100vh" }}>
      {/* Filters & Actions - Sticky */}
      <div style={{
        display: "flex",
        gap: "1rem",
        alignItems: "center",
        marginBottom: "1.5rem",
        background: "white",
        padding: "1rem 1.5rem",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        position: "sticky",
        top: "-0.5rem",
        zIndex: 100
      }}>
        <div style={{ flex: 2, position: "relative" }}>
          <FaSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9ca3af" }} />
          <input
            type="text"
            placeholder="Search foods..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: "100%",
              padding: "10px 12px 10px 40px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              outline: "none",
              fontSize: "14px",
              backgroundColor: "#ffffff",
              color: "#111827"
            }}
          />
        </div>
        <div style={{ flex: 1 }}>
          <select
            value={selectedCategory}
            onChange={(e) => { setSelectedCategory(e.target.value); setPage(1); }}
            style={{
              width: "100%",
              padding: "10px 12px",
              borderRadius: "8px",
              border: "1px solid #d1d5db",
              outline: "none",
              fontSize: "14px",
              backgroundColor: "#ffffff",
              color: "#111827"
            }}
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => { resetModal(); setShowAddModal(true); }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            backgroundColor: "#10b981",
            color: "white",
            padding: "10px 20px",
            borderRadius: "8px",
            border: "none",
            fontWeight: "600",
            cursor: "pointer",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
            whiteSpace: "nowrap"
          }}
        >
          <FaPlus /> Add Food
        </button>
      </div>

      {/* Table with scrollable body and sticky header */}
      <div style={{
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
        maxHeight: "calc(100vh - 200px)",
        overflowY: "auto",
        overflowX: "auto",
      }}>
        <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
          <thead>
            <tr style={{ backgroundColor: "#f9fafb", borderBottom: "1px solid #e5e7eb" }}>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>S.No</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Food Item</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Category</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Qty</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Cals</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Protein</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Carbs</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Fat</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Fiber</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Sugar</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Sodium</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Cal</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Iron</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Mag</th>
              <th style={{ padding: "12px 16px", fontSize: "12px", fontWeight: "600", color: "#4b5563", textTransform: "uppercase", position: "sticky", top: 0, backgroundColor: "#f9fafb", zIndex: 10 }}>Pot</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="15" style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>Loading foods...</td>
              </tr>
            ) : foods.length === 0 ? (
              <tr>
                <td colSpan="15" style={{ padding: "3rem", textAlign: "center", color: "#6b7280" }}>No foods found</td>
              </tr>
            ) : (
              foods.map((food, index) => (
                <tr key={food.id} style={{ borderBottom: "1px solid #f3f4f6" }}>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827" }}>{(page - 1) * limit + index + 1}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", fontWeight: "600", color: "#111827" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <button
                        onClick={() => openEditModal(food)}
                        style={{
                          background: "transparent",
                          border: "none",
                          color: "#10b981",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          fontSize: "16px",
                          padding: 0
                        }}
                        title="Edit Food"
                      >
                        <FaEdit />
                      </button>
                      {food.item}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>
                    <span style={{ backgroundColor: "#f3f4f6", padding: "2px 8px", borderRadius: "12px", fontSize: "12px" }}>{food.categories}</span>
                  </td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.quantity}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#111827", fontWeight: "600" }}>{food.calories}</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.protein}g</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.carbs}g</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.fat}g</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.fiber}g</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.sugar}g</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.sodium}mg</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.calcium}mg</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.iron}mg</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.magnesium}mg</td>
                  <td style={{ padding: "12px 16px", fontSize: "14px", color: "#4b5563" }}>{food.potassium}mg</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {renderPagination()}

      {/* Add/Edit Modal */}
      {(showAddModal || showEditModal) && (
        <div style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: "rgba(0,0,0,0.5)",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 2000,
          padding: "1rem"
        }}>
          <div style={{
            backgroundColor: "white",
            borderRadius: "12px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "2rem",
            boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
              <h2 style={{ fontSize: "20px", fontWeight: "700", color: "#111827", margin: 0 }}>
                {showAddModal ? "Add New Food" : "Edit Food"}
              </h2>
              <button onClick={() => { setShowAddModal(false); setShowEditModal(false); }} style={{ background: "transparent", border: "none", color: "#6b7280", cursor: "pointer" }}>
                <FaTimes size={20} />
              </button>
            </div>

            <form onSubmit={showAddModal ? handleAddFood : handleEditFood} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div style={{ gridColumn: "span 2" }}>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Food Item Name *</label>
                <input
                  required
                  type="text"
                  value={modalData.item}
                  onChange={(e) => setModalData({ ...modalData, item: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Category *</label>
                <input
                  required
                  type="text"
                  list="modal-categories"
                  value={modalData.categories}
                  onChange={(e) => setModalData({ ...modalData, categories: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
                <datalist id="modal-categories">
                  {categories.map(cat => <option key={cat} value={cat} />)}
                </datalist>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Quantity (e.g. 100g) *</label>
                <input
                  required
                  type="text"
                  value={modalData.quantity}
                  onChange={(e) => setModalData({ ...modalData, quantity: e.target.value })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Calories *</label>
                <input
                  required
                  type="number"
                  value={modalData.calories}
                  onChange={(e) => setModalData({ ...modalData, calories: parseInt(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Protein (g) *</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={modalData.protein}
                  onChange={(e) => setModalData({ ...modalData, protein: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Carbs (g) *</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={modalData.carbs}
                  onChange={(e) => setModalData({ ...modalData, carbs: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Fat (g) *</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={modalData.fat}
                  onChange={(e) => setModalData({ ...modalData, fat: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Fiber (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={modalData.fiber}
                  onChange={(e) => setModalData({ ...modalData, fiber: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Sugar (g)</label>
                <input
                  type="number"
                  step="0.1"
                  value={modalData.sugar}
                  onChange={(e) => setModalData({ ...modalData, sugar: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Sodium (mg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={modalData.sodium}
                  onChange={(e) => setModalData({ ...modalData, sodium: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Calcium (mg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={modalData.calcium}
                  onChange={(e) => setModalData({ ...modalData, calcium: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Iron (mg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={modalData.iron}
                  onChange={(e) => setModalData({ ...modalData, iron: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Magnesium (mg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={modalData.magnesium}
                  onChange={(e) => setModalData({ ...modalData, magnesium: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#374151", marginBottom: "6px" }}>Potassium (mg)</label>
                <input
                  type="number"
                  step="0.1"
                  value={modalData.potassium}
                  onChange={(e) => setModalData({ ...modalData, potassium: parseFloat(e.target.value) || 0 })}
                  style={{ width: "100%", padding: "10px", borderRadius: "6px", border: "1px solid #d1d5db", outline: "none", backgroundColor: "#ffffff", color: "#111827" }}
                />
              </div>

              <div style={{ gridColumn: "span 2", marginTop: "1rem" }}>
                <button
                  type="submit"
                  style={{
                    width: "100%",
                    backgroundColor: "#10b981",
                    color: "white",
                    padding: "12px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "700",
                    fontSize: "16px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px"
                  }}
                >
                  <FaSave /> {showAddModal ? "Save Food Item" : "Update Food Item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .table-responsive {
          width: 100%;
          overflow-x: auto;
        }
        .users-table {
          width: 100%;
          border-collapse: collapse;
        }
        .users-table th, .users-table td {
          padding: 12px 16px;
          border-bottom: 1px solid #e5e7eb;
        }
        .users-table tr:hover {
          background-color: #f9fafb;
        }
      `}</style>
    </div>
  );
}
