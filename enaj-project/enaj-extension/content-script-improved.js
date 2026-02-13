// Enaj Content Script - Improved Ingredient Extraction
// Injected into supported shopping sites to scrape product data

(() => {
  // Improved ingredient extraction function
  function extractIngredientsFromText(text) {
    // Look for "Ingredients:" label followed by the actual ingredients
    const patterns = [
      /ingredients?:\s*([^.]+(?:\.[^.]*)*)/i,  // Match "Ingredients: ... "
      /ingredients?[:\s]+(.+?)(?=\n\n|\n[A-Z]|$)/is,  // Multi-line ingredients
      /ingredients?[:\s]*(.+)/i  // Simple fallback
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match && match[1] && match[1].trim().length > 20) {
        let ingredientText = match[1].trim();

        // Clean up the text
        ingredientText = ingredientText
          .replace(/^ingredients?:?\s*/i, '')  // Remove "Ingredients:" prefix
          .replace(/\s+/g, ' ')  // Normalize whitespace
          .replace(/\n+/g, ', ')  // Replace newlines with commas
          .trim();

        // Only return if it looks like ingredients (contains commas or multiple words)
        if (ingredientText.includes(',') || ingredientText.split(' ').length > 5) {
          return ingredientText;
        }
      }
    }
    return '';
  }

  // Site-specific scrapers
  const scrapers = {
    "amazon.com": () => {
      const name = document.getElementById("productTitle")?.innerText?.trim();
      const brand =
        document.getElementById("bylineInfo")?.innerText?.replace(/^(Brand:|Visit the|Shop)\s*/i, "").trim() ||
        document.querySelector("[data-brand]")?.dataset?.brand ||
        "";
      const price =
        document.querySelector(".a-price .a-offscreen")?.innerText?.trim() ||
        document.querySelector("#priceblock_ourprice")?.innerText?.trim() ||
        document.querySelector("#priceblock_dealprice")?.innerText?.trim() ||
        "";

      let ingredients = "";

      // Priority 1: Important Information section (most reliable)
      const importantSections = document.querySelectorAll("#important-information .content, #important-information");
      for (const section of importantSections) {
        const text = section.innerText || section.textContent;
        if (/ingredients?/i.test(text)) {
          ingredients = extractIngredientsFromText(text);
          if (ingredients) break;
        }
      }

      // Priority 2: Product description sections
      if (!ingredients) {
        const descSections = document.querySelectorAll(
          "#productDescription, #feature-bullets, #aplus, .aplus-v2, #detail-bullets, .product-description"
        );
        for (const section of descSections) {
          const text = section.innerText || section.textContent;
          if (/ingredients?/i.test(text)) {
            ingredients = extractIngredientsFromText(text);
            if (ingredients) break;
          }
        }
      }

      // Priority 3: Look in all text content
      if (!ingredients) {
        const allDivs = document.querySelectorAll("div, section, td, li");
        for (const div of allDivs) {
          const text = div.innerText || div.textContent;
          if (text && /^ingredients?:/i.test(text.trim()) && text.length < 2000) {
            ingredients = extractIngredientsFromText(text);
            if (ingredients) break;
          }
        }
      }

      return { name, brand, price, ingredients, url: window.location.href };
    },

    "sephora.com": () => {
      const name =
        document.querySelector('[data-at="product_name"]')?.innerText?.trim() ||
        document.querySelector("h1")?.innerText?.trim() ||
        "";
      const brand =
        document.querySelector('[data-at="brand_name"]')?.innerText?.trim() ||
        document.querySelector(".Brand a")?.innerText?.trim() ||
        "";
      const price =
        document.querySelector('[data-at="price"]')?.innerText?.trim() ||
        document.querySelector(".css-0")?.innerText?.trim() ||
        "";

      let ingredients = "";

      // Sephora often has a dedicated Ingredients section
      const ingredientSections = document.querySelectorAll(
        '[data-at="ingredients"], .css-1ue8dmw, [class*="Ingredients"], [class*="ingredients"]'
      );

      for (const section of ingredientSections) {
        const text = section.innerText || section.textContent;
        if (text && text.length > 20) {
          ingredients = extractIngredientsFromText(text);
          if (ingredients) break;
        }
      }

      // Fallback: search all content
      if (!ingredients) {
        const allElements = document.querySelectorAll("div, p, section");
        for (const el of allElements) {
          const text = el.innerText || el.textContent;
          if (text && /^ingredients?:/i.test(text.trim())) {
            ingredients = extractIngredientsFromText(text);
            if (ingredients) break;
          }
        }
      }

      return { name, brand, price, ingredients, url: window.location.href };
    },

    "target.com": () => {
      const name =
        document.querySelector('[data-test="product-title"]')?.innerText?.trim() ||
        document.querySelector("h1")?.innerText?.trim() ||
        "";
      const brand =
        document.querySelector('[data-test="product-brand"] a')?.innerText?.trim() || "";
      const price =
        document.querySelector('[data-test="product-price"]')?.innerText?.trim() || "";

      let ingredients = "";
      const allElements = document.querySelectorAll("div, p, section, td");
      for (const el of allElements) {
        const text = el.innerText || el.textContent;
        if (text && /ingredients?:/i.test(text)) {
          ingredients = extractIngredientsFromText(text);
          if (ingredients) break;
        }
      }

      return { name, brand, price, ingredients, url: window.location.href };
    },

    // Generic fallback scraper
    _generic: () => {
      const name = document.querySelector("h1")?.innerText?.trim() || document.title || "";
      const brand = "";
      const price = "";

      let ingredients = "";
      const allElements = document.querySelectorAll("div, p, span, td, li, section");
      for (const el of allElements) {
        const text = el.innerText || el.textContent;
        if (text && /^ingredients?:/i.test(text.trim()) && text.length < 3000) {
          ingredients = extractIngredientsFromText(text);
          if (ingredients) break;
        }
      }

      return { name, brand, price, ingredients, url: window.location.href };
    },
  };

  // Determine which scraper to use
  function getScraper() {
    const hostname = window.location.hostname.replace("www.", "");
    for (const [domain, fn] of Object.entries(scrapers)) {
      if (domain !== "_generic" && hostname.includes(domain)) {
        return fn;
      }
    }
    return scrapers._generic;
  }

  // Listen for scrape requests from popup via background
  chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "scrapeProduct") {
      try {
        const scraper = getScraper();
        const product = scraper();

        // Clean up ingredients string
        if (product.ingredients) {
          product.ingredients = product.ingredients
            .replace(/^ingredients?:?\s*/i, '')  // Remove "Ingredients:" prefix
            .replace(/\n+/g, ', ')  // Replace newlines with commas
            .replace(/\s{2,}/g, ' ')  // Normalize spaces
            .trim();

          // Trim if absurdly long
          if (product.ingredients.length > 2000) {
            product.ingredients = product.ingredients.substring(0, 2000);
          }
        }

        console.log('[Enaj] Scraped ingredients:', product.ingredients);
        sendResponse({ product });
      } catch (err) {
        console.error('[Enaj] Scraping error:', err);
        sendResponse({ error: "Failed to read page: " + err.message });
      }
    }
    return true;  // Keep message channel open for async response
  });

  console.log('[Enaj] Content script loaded on', window.location.hostname);
})();
