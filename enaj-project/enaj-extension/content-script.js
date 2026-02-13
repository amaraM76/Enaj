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
        "";

      let ingredients = "";

      // 1. Target the #ingredients div directly (Sephora's primary pattern)
      const ingredientsDiv = document.getElementById("ingredients");
      if (ingredientsDiv) {
        // Get the text content, skip the heading element itself
        const heading = document.getElementById("ingredients_heading");
        let text = ingredientsDiv.innerText || "";
        if (heading) {
          text = text.replace(heading.innerText, "").trim();
        }
        // Clean the "Ingredients:" label if present
        text = text.replace(/^ingredients?\s*[:\-–—]?\s*/i, "").trim();
        if (text.length > 10 && text.includes(",")) {
          ingredients = text;
        }
      }

      // 2. Look for any element with id or class containing "ingredient"
      if (!ingredients) {
        const candidates = document.querySelectorAll(
          '[id*="ingredient" i], [class*="ingredient" i], [data-at="ingredients"], [data-comp*="Ingredient"]'
        );
        for (const el of candidates) {
          const text = (el.innerText || "").replace(/^ingredients?\s*[:\-–—]?\s*/i, "").trim();
          if (text.includes(",") && text.length > ingredients.length) {
            ingredients = text;
          }
        }
      }

      // 3. Look in tabbed content sections (Sephora uses tabs for Details/Ingredients/How to Use)
      if (!ingredients) {
        const tabPanels = document.querySelectorAll(
          '[role="tabpanel"], [class*="TabPanel"], [class*="tabpanel"], [class*="Accordion"]'
        );
        for (const panel of tabPanels) {
          const text = panel.innerText || "";
          if (/ingredients?\s*[:\-–—]?\s*/i.test(text) && text.includes(",")) {
            const cleaned = text.replace(/^[\s\S]*?ingredients?\s*[:\-–—]?\s*/i, "").trim();
            // Cut off at the next section
            const cutoff = cleaned.search(
              /\n\s*(how to use|directions|about the brand|what it is|what else you need|clean at sephora)\s*[:\-–—]?\s*/i
            );
            const final = cutoff > 0 ? cleaned.substring(0, cutoff).trim() : cleaned;
            if (final.includes(",") && final.length > ingredients.length) {
              ingredients = final;
            }
          }
        }
      }

      // 4. Broadest fallback — scan all text blocks for "Ingredients:" followed by a comma list
      if (!ingredients) {
        const allEls = document.querySelectorAll("div, p, span, section");
        for (const el of allEls) {
          if (el.children.length > 15) continue; // skip large containers
          const text = el.innerText || "";
          if (text.length < 30 || text.length > 5000) continue;
          if (/ingredients?\s*[:\-–—]\s*/i.test(text) && text.includes(",")) {
            const match = text.match(/ingredients?\s*[:\-–—]\s*([\s\S]+)/i);
            if (match && match[1].includes(",") && match[1].length > ingredients.length) {
              // Cut off at next section heading
              let result = match[1].trim();
              const cutoff = result.search(
                /\n\s*(how to use|directions|warnings?|about|clean at|what it is)\s*[:\-–—]?\s*/i
              );
              if (cutoff > 0) result = result.substring(0, cutoff).trim();
              if (result.length > ingredients.length) ingredients = result;
            }
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

      // First check for common ingredient container IDs/classes
      const directTargets = document.querySelectorAll(
        '#ingredients, #Ingredients, [id*="ingredient" i], [class*="ingredient" i], [data-at="ingredients"]'
      );
      for (const el of directTargets) {
        const text = (el.innerText || "").replace(/^ingredients?\s*[:\-–—]?\s*/i, "").trim();
        if (text.includes(",") && text.length > ingredients.length) {
          ingredients = text;
        }
      }

      // Fallback: look for any element containing "ingredients" followed by a comma-separated list
      if (!ingredients) {
        const allElements = document.querySelectorAll("div, p, span, td, li, section");
        allElements.forEach((el) => {
          if (el.children.length > 15) return;
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