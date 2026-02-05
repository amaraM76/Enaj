// Complete ailments database with ingredients to avoid
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
      { name: "Parkinson's Disease", icon: "🧠", avoid: ["Artificial Sweeteners (Aspartame)", "High Iron Supplements", "Pesticide Residues", "BPA", "Lead", "Mercury", "Aluminum (in some products)"] },
      { name: "Migraines", icon: "🤕", avoid: ["Tyramine", "MSG", "Nitrates/Nitrites", "Artificial Sweeteners (Aspartame)", "Sulfites", "Caffeine (excess)", "Alcohol", "Aged Cheese"] },
      { name: "Multiple Sclerosis", icon: "🔬", avoid: ["Saturated Fats (excess)", "Processed Sugars", "Gluten (some patients)", "Artificial Additives", "Excess Sodium", "Dairy (some patients)"] },
      { name: "Epilepsy", icon: "⚕️", avoid: ["Artificial Sweeteners (Aspartame)", "MSG", "Excess Caffeine", "Alcohol", "Grapefruit (drug interactions)"] },
      { name: "Dementia / Alzheimer's", icon: "🧩", avoid: ["Aluminum (in products)", "Excess Sodium", "Trans Fats", "Nitrates/Nitrites", "Artificial Sweeteners (Aspartame)", "High-Mercury Fish", "Processed Meats", "Excess Alcohol"] },
      { name: "Fibromyalgia", icon: "💫", avoid: ["MSG", "Artificial Sweeteners (Aspartame)", "Gluten (some patients)", "Caffeine (excess)", "Processed Foods", "Nightshade Vegetables", "Sugar (excess)", "Food Dyes"] },
      { name: "ADHD", icon: "⚡", avoid: ["Artificial Food Dyes (Red 40, Yellow 5, Yellow 6)", "Artificial Sweeteners", "MSG", "High-Fructose Corn Syrup", "Sodium Benzoate", "Excess Sugar", "Salicylates (some patients)"] },
      { name: "Autism (Sensory Sensitivities)", icon: "🌈", avoid: ["Artificial Food Dyes", "Artificial Flavors", "MSG", "Casein", "Gluten (some individuals)", "Artificial Preservatives", "High-Fructose Corn Syrup", "Soy (some individuals)"] },
      { name: "Chronic Fatigue Syndrome", icon: "🔋", avoid: ["Caffeine (excess)", "Refined Sugars", "Alcohol", "Artificial Sweeteners", "Processed Foods", "Gluten (some patients)", "Dairy (some patients)"] },
      { name: "Neuropathy", icon: "🫳", avoid: ["Alcohol", "Excess Sugar", "Gluten (some patients)", "Artificial Sweeteners", "Heavy Metals (Mercury, Lead)", "MSG"] },
    ]
  },
  {
    category: "Autoimmune & Inflammatory",
    items: [
      { name: "Lupus", icon: "🦋", avoid: ["Alfalfa Sprouts", "Garlic (large amounts)", "Echinacea", "Sulfites", "High Sodium", "Processed Foods", "Alcohol"] },
      { name: "Rheumatoid Arthritis", icon: "🦴", avoid: ["Refined Sugars", "Omega-6 (excess)", "Fried Foods", "Gluten (some patients)", "Alcohol", "Processed Meats", "AGEs (Advanced Glycation End-products)"] },
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
  },
];

const PERSONAL_PREFERENCES = [
  { category: "Artificial Additives", items: ["Artificial Sweeteners", "Artificial Colors/Dyes", "Artificial Flavors", "Artificial Fragrances/Parfum", "MSG", "High-Fructose Corn Syrup", "Artificial Preservatives", "Sodium Benzoate", "Potassium Sorbate", "BHT / BHA"] },
  { category: "Chemicals & Compounds", items: ["Parabens", "Phthalates", "Sulfates (SLS/SLES)", "Formaldehyde", "Triclosan", "BPA / BPS", "Aluminum Compounds", "Petroleum / Mineral Oil", "Silicones", "PEGs (Polyethylene Glycols)", "Oxybenzone", "Talc", "Propylene Glycol", "Phenoxyethanol"] },
  { category: "Lifestyle & Diet", items: ["Non-Organic", "GMO Ingredients", "Animal Products (Vegan)", "Animal Testing (Not Cruelty-Free)", "Dairy", "Gluten", "Soy", "Palm Oil", "Alcohol (in skin products)", "Alcohol (in food/beverages)", "Caffeine", "Refined Sugar", "Trans Fats", "Seed Oils (Canola, Soybean, Sunflower, Safflower)", "Food Dyes (Red 40, Yellow 5, Yellow 6, Blue 1)", "Gums & Thickeners (Xanthan, Guar, Carrageenan)", "Citric Acid (manufactured)", "Nitrates / Nitrites", "Sodium Nitrate", "Maltodextrin", "Natural Flavors (undisclosed)", "Carrageenan", "Corn Syrup / Corn Starch", "Canola Oil", "Vegetable Oil (unspecified)", "Soy Lecithin", "Cellulose / Powdered Cellulose", "Titanium Dioxide"] },
  { category: "Environmental & Ethical", items: ["Non-Recyclable Packaging", "Microplastics", "Non-Biodegradable Ingredients", "Single-Use Plastics", "Bleached Fabrics / Chlorine-Bleached", "Formaldehyde-Treated Textiles", "PFAS / Forever Chemicals", "Synthetic Microfibers", "Non-Fair-Trade", "Tested on Animals", "Unsustainable Palm Oil", "Excess Plastic Packaging", "Non-Compostable Materials"] },
];

// Helper function to get avoid list for an ailment
function getAvoidListForAilment(ailmentName) {
  for (const category of AILMENTS_DATA) {
    const ailment = category.items.find(item => item.name === ailmentName);
    if (ailment) {
      return ailment.avoid;
    }
  }
  return [];
}

// Helper function to get ailment info
function getAilmentInfo(ailmentName) {
  for (const category of AILMENTS_DATA) {
    const ailment = category.items.find(item => item.name === ailmentName);
    if (ailment) {
      return { ...ailment, category: category.category };
    }
  }
  return null;
}

module.exports = {
  AILMENTS_DATA,
  PERSONAL_PREFERENCES,
  getAvoidListForAilment,
  getAilmentInfo
};
