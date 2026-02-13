// ============================================================
// Enaj Ailments & Preferences Data (mirrors backend/ailmentsData.js)
// ============================================================

const AILMENTS_DATA = [
  {
    category: "Skin Conditions",
    items: [
      { name: "Eczema", icon: "🧴", avoid: ["Fragrance/Parfum", "Sodium Lauryl Sulfate (SLS)", "Alcohol Denat", "Parabens", "Formaldehyde", "Lanolin", "Propylene Glycol", "Cocamidopropyl Betaine", "Essential Oils"] },
      { name: "Rosacea", icon: "🌹", avoid: ["Alcohol Denat", "Fragrance/Parfum", "Menthol", "Witch Hazel", "Eucalyptus Oil", "Peppermint", "Salicylic Acid", "Retinol", "Sodium Lauryl Sulfate (SLS)"] },
      { name: "Psoriasis", icon: "💧", avoid: ["Fragrance/Parfum", "Alcohol Denat", "Sulfates", "Parabens", "Formaldehyde", "Coal Tar (in some contexts)", "Salicylic Acid (high %)", "Essential Oils"] },
      { name: "Acne-Prone Skin", icon: "✨", avoid: ["Coconut Oil", "Isopropyl Myristate", "Algae Extract", "Lanolin", "Cocoa Butter", "Sodium Lauryl Sulfate (SLS)", "Mineral Oil", "Silicones (heavy)"] },
      { name: "Contact Dermatitis", icon: "⚡", avoid: ["Fragrance/Parfum", "Nickel", "Formaldehyde", "Preservatives (MI/MCI)", "Lanolin", "Balsam of Peru", "Parabens", "Cobalt Chloride"] },
      { name: "Sensitive Skin", icon: "🪶", avoid: ["Fragrance/Parfum", "Alcohol Denat", "Sulfates", "Parabens", "Essential Oils", "Retinol", "AHA/BHA (high %)", "Synthetic Dyes"] },
    ]
  },
  {
    category: "Digestive & Food",
    items: [
      { name: "Celiac Disease", icon: "🌾", avoid: ["Gluten", "Wheat", "Barley", "Rye", "Malt", "Brewer's Yeast", "Hydrolyzed Wheat Protein", "Modified Food Starch (wheat-based)"] },
      { name: "IBS", icon: "🫃", avoid: ["High-FODMAP Foods", "Artificial Sweeteners", "Lactose", "Fructose (excess)", "Sugar Alcohols (sorbitol, mannitol)", "Caffeine", "Inulin/Chicory Root", "Garlic & Onion Powder"] },
      { name: "Crohn's Disease", icon: "🩺", avoid: ["High-Fiber Insoluble Foods", "Lactose", "Artificial Sweeteners", "Spicy Ingredients", "High-Fat Foods", "Alcohol", "Caffeine", "Raw Vegetables"] },
      { name: "Lactose Intolerance", icon: "🥛", avoid: ["Lactose", "Milk Solids", "Whey", "Casein", "Cream", "Butter (in large amounts)", "Milk Powder", "Cheese (aged may be OK)"] },
      { name: "GERD / Acid Reflux", icon: "🔥", avoid: ["Citric Acid (high amounts)", "Caffeine", "Chocolate", "Peppermint", "Tomato-Based Ingredients", "Spicy Ingredients", "Carbonation", "High-Fat Foods"] },
      { name: "Food Allergies (Nut)", icon: "🥜", avoid: ["Tree Nuts", "Peanuts", "Peanut Oil", "Almond Extract", "Nutella-type Spreads", "Marzipan", "Praline", "Mixed Nuts"] },
      { name: "Food Allergies (Shellfish)", icon: "🦐", avoid: ["Shrimp", "Crab", "Lobster", "Glucosamine (shellfish-derived)", "Chitosan", "Carrageenan (sometimes cross-reactive)", "Fish Sauce"] },
      { name: "Food Allergies (Soy)", icon: "🫘", avoid: ["Soy Lecithin", "Soy Protein", "Soybean Oil", "Tofu", "Edamame", "Miso", "Tempeh", "Textured Vegetable Protein"] },
      { name: "Food Allergies (Egg)", icon: "🥚", avoid: ["Egg Whites", "Egg Yolks", "Albumin", "Lysozyme", "Mayonnaise", "Meringue", "Lecithin (egg-derived)"] },
    ]
  },
  {
    category: "Neurological & Chronic",
    items: [
      { name: "Migraines", icon: "🤕", avoid: ["Tyramine", "MSG", "Nitrates/Nitrites", "Artificial Sweeteners (Aspartame)", "Sulfites", "Caffeine (excess)", "Alcohol", "Aged Cheese"] },
      { name: "ADHD", icon: "⚡", avoid: ["Artificial Food Dyes", "Artificial Sweeteners", "MSG", "High-Fructose Corn Syrup", "Sodium Benzoate", "Excess Sugar", "Caffeine"] },
      { name: "Multiple Sclerosis", icon: "🔬", avoid: ["Saturated Fats (excess)", "Processed Sugars", "Gluten (some patients)", "Artificial Additives", "Alcohol", "Processed Meats", "AGEs (Advanced Glycation End-products)"] },
      { name: "Parkinson's Disease", icon: "🧠", avoid: ["Artificial Sweeteners (Aspartame)", "High Iron Supplements", "Pesticide Residues", "BPA", "Lead", "Mercury", "Aluminum (in some products)"] },
    ]
  },
  {
    category: "Autoimmune & Hormonal",
    items: [
      { name: "Lupus", icon: "🦋", avoid: ["Alfalfa Sprouts", "Echinacea", "Garlic Supplements", "Sulfites", "Artificial Preservatives", "Trans Fats", "Excess Sodium"] },
      { name: "Hashimoto's", icon: "🦋", avoid: ["Excess Iodine", "Gluten (some patients)", "Soy (excess)", "Goitrogens (raw cruciferous, excess)", "Highly Processed Foods", "Artificial Sweeteners"] },
      { name: "Type 1 Diabetes", icon: "💉", avoid: ["Added Sugars", "High-Glycemic Ingredients", "Trans Fats", "Excess Sodium", "Artificial Sweeteners (some)"] },
      { name: "Type 2 Diabetes", icon: "📊", avoid: ["Added Sugars", "High-Fructose Corn Syrup", "Refined Carbohydrates", "Trans Fats", "Excess Sodium", "Artificial Sweeteners (some)"] },
    ]
  },
  {
    category: "Respiratory & Allergies",
    items: [
      { name: "Asthma", icon: "🫁", avoid: ["Sulfites", "Sodium Bisulfite", "Tartrazine (Yellow #5)", "Aspirin-related compounds", "MSG", "Strong Fragrances"] },
      { name: "Seasonal Allergies", icon: "🤧", avoid: ["Pollen-Cross-Reactive Foods", "Histamine-Rich Foods", "Sulfites", "Artificial Colors", "Preservatives (Benzoates)"] },
      { name: "Mast Cell Disorder (MCAS)", icon: "🔴", avoid: ["Histamine-Rich Foods", "Alcohol", "Fermented Foods", "Aged Cheeses", "Artificial Preservatives", "Sulfites", "Artificial Colors", "Benzoates"] },
    ]
  }
];

const PERSONAL_PREFERENCES = [
  { category: "Artificial Additives", items: ["Artificial Sweeteners", "Artificial Colors/Dyes", "Artificial Flavors", "Artificial Fragrances/Parfum", "MSG", "High-Fructose Corn Syrup", "Artificial Preservatives", "Sodium Benzoate", "Potassium Sorbate", "BHT / BHA"] },
  { category: "Chemicals & Compounds", items: ["Parabens", "Phthalates", "Sulfates (SLS/SLES)", "Formaldehyde", "Triclosan", "BPA / BPS", "Aluminum Compounds", "Petroleum / Mineral Oil", "Silicones", "PEGs (Polyethylene Glycols)", "Oxybenzone", "Talc", "Propylene Glycol", "Phenoxyethanol"] },
  { category: "Lifestyle & Diet", items: ["Non-Organic", "GMO Ingredients", "Animal Products (Vegan)", "Dairy", "Gluten", "Soy", "Palm Oil", "Seed Oils (Canola, Soybean, Sunflower, Safflower)", "Food Dyes (Red 40, Yellow 5, Yellow 6, Blue 1)", "Carrageenan", "Corn Syrup / Corn Starch", "Titanium Dioxide"] },
  { category: "Environmental & Ethical", items: ["Microplastics", "PFAS / Forever Chemicals", "Tested on Animals", "Unsustainable Palm Oil"] },
];
