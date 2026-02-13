// Enaj Content Script
// Injected into supported shopping sites to scrape product data

(() => {
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

      // Ingredients can be in multiple places on Amazon
      let ingredients = "";

      // 1. "Important Information" section
      const importantSections = document.querySelectorAll("#important-information .content");
      importantSections.forEach((section) => {
        const text = section.innerText;
        if (/ingredient/i.test(text)) {
          // Try to grab just the ingredient line
          const lines = text.split("\n").filter((l) => l.trim());
          const idx = lines.findIndex((l) => /ingredient/i.test(l));
          if (idx !== -1 && lines[idx + 1]) {
            ingredients = lines.slice(idx + 1).join(", ");
          } else {
            ingredients = text;
          }
        }
      });

      // 2. Product description / bullet points
      if (!ingredients) {
        const featureBullets = document.querySelectorAll("#feature-bullets li span");
        featureBullets.forEach((b) => {
          if (/ingredient/i.test(b.innerText)) {
            ingredients = b.innerText;
          }
        });
      }

      // 3. "Product Details" / "From the Manufacturer"
      if (!ingredients) {
        const detailSections = document.querySelectorAll(
          "#productDescription, #aplus, .aplus-v2, #detail-bullets"
        );
        detailSections.forEach((section) => {
          const text = section.innerText;
          if (/ingredient/i.test(text)) {
            const match = text.match(/ingredients?[:\s]*([^\n]+(?:\n[^\n]+)*)/i);
            if (match) ingredients = match[1].trim();
          }
        });
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
      // Sephora has an "Ingredients" tab/section
      const allSections = document.querySelectorAll(
        '[data-at="ingredients"], .css-1ue8dmw, [class*="Ingredients"]'
      );
      allSections.forEach((el) => {
        if (el.innerText.length > ingredients.length) {
          ingredients = el.innerText.replace(/^ingredients?[:\s]*/i, "").trim();
        }
      });

      // Fallback: search all text blocks
      if (!ingredients) {
        document.querySelectorAll("div, p, span").forEach((el) => {
          const text = el.innerText;
          if (
            /^ingredients?:/i.test(text.trim()) ||
            (/ingredient/i.test(text) && text.includes(",") && text.length > 50)
          ) {
            if (text.length > ingredients.length) {
              ingredients = text.replace(/^ingredients?[:\s]*/i, "").trim();
            }
          }
        });
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
      // Target often has ingredients in the "Details" tab
      document.querySelectorAll("div, p, span").forEach((el) => {
        const text = el.innerText;
        if (/ingredients?[:\s]/i.test(text) && text.includes(",") && text.length > 40) {
          const match = text.match(/ingredients?[:\s]*(.+)/is);
          if (match && match[1].length > ingredients.length) {
            ingredients = match[1].trim();
          }
        }
      });

      return { name, brand, price, ingredients, url: window.location.href };
    },

    "ulta.com": () => {
      const name =
        document.querySelector(".ProductMainSection__productName")?.innerText?.trim() ||
        document.querySelector("h1")?.innerText?.trim() ||
        "";
      const brand =
        document.querySelector(".ProductMainSection__brandName a")?.innerText?.trim() ||
        document.querySelector('[class*="brand"] a')?.innerText?.trim() ||
        "";
      const price =
        document.querySelector(".ProductPricingPanel span")?.innerText?.trim() || "";

      let ingredients = "";
      document.querySelectorAll("div, p, span, li").forEach((el) => {
        const text = el.innerText;
        if (/ingredients?[:\s]/i.test(text) && text.includes(",") && text.length > 40) {
          const match = text.match(/ingredients?[:\s]*(.+)/is);
          if (match && match[1].length > ingredients.length) {
            ingredients = match[1].trim();
          }
        }
      });

      return { name, brand, price, ingredients, url: window.location.href };
    },

    "walmart.com": () => {
      const name = document.querySelector('[itemprop="name"]')?.innerText?.trim() ||
        document.querySelector("h1")?.innerText?.trim() || "";
      const brand = document.querySelector('[itemprop="brand"]')?.innerText?.trim() ||
        document.querySelector('[data-testid="product-brand"] a')?.innerText?.trim() || "";
      const price = document.querySelector('[itemprop="price"]')?.innerText?.trim() ||
        document.querySelector('[data-testid="price-wrap"]')?.innerText?.trim() || "";

      let ingredients = "";
      document.querySelectorAll("div, p, span, td").forEach((el) => {
        const text = el.innerText;
        if (/ingredients?[:\s]/i.test(text) && text.includes(",") && text.length > 40) {
          const match = text.match(/ingredients?[:\s]*(.+)/is);
          if (match && match[1].length > ingredients.length) {
            ingredients = match[1].trim();
          }
        }
      });

      return { name, brand, price, ingredients, url: window.location.href };
    },

    // Generic fallback scraper for unsupported sites
    _generic: () => {
      const name = document.querySelector("h1")?.innerText?.trim() || document.title || "";
      const brand = "";
      const price = "";

      let ingredients = "";
      // Look for any element containing "ingredients" followed by a comma-separated list
      const allElements = document.querySelectorAll("div, p, span, td, li, section");
      allElements.forEach((el) => {
        const text = el.innerText;
        if (
          /ingredients?[:\s]/i.test(text) &&
          text.includes(",") &&
          text.length > 30 &&
          text.length < 3000
        ) {
          const match = text.match(/ingredients?[:\s]*(.+)/is);
          if (match && match[1].length > ingredients.length) {
            ingredients = match[1].trim();
          }
        }
      });

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
            .replace(/\n+/g, ", ")
            .replace(/\s{2,}/g, " ")
            .replace(/ingredients?[:\s]*/i, "")
            .trim();

          // Trim if absurdly long (probably grabbed too much DOM text)
          if (product.ingredients.length > 2000) {
            product.ingredients = product.ingredients.substring(0, 2000);
          }
        }

        sendResponse({ product });
      } catch (err) {
        sendResponse({ error: "Failed to read page: " + err.message });
      }
    }
  });
})();
