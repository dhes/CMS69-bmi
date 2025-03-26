const puppeteer = require("puppeteer");
const fs = require("fs");
const path = require("path");

// ValueSet array (use your full array in the actual implementation)
const valueSetArray = [
  {
    type: "depends-on",
    display: "Value set Falls Screening",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.118.12.1028",
  },
  {
    type: "depends-on",
    display: "Value set Office Visit",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1001",
  },
  {
    type: "depends-on",
    display: "Value set Annual Wellness Visit",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.3.1240",
  },
  {
    type: "depends-on",
    display:
      "Value set Preventive Care Services Established Office Visit, 18 and Up",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1025",
  },
  {
    type: "depends-on",
    display:
      "Value set Preventive Care Services Initial Office Visit, 18 and Up",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1023",
  },
  {
    type: "depends-on",
    display: "Value set Home Healthcare Services",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1016",
  },
  {
    type: "depends-on",
    display: "Value set Ophthalmological Services",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.3.1285",
  },
  {
    type: "depends-on",
    display: "Value set Preventive Care Services Individual Counseling",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1026",
  },
  {
    type: "depends-on",
    display: "Value set Discharge Services Nursing Facility",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1013",
  },
  {
    type: "depends-on",
    display: "Value set Nursing Facility Visit",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1012",
  },
  {
    type: "depends-on",
    display: "Value set Care Services in Long Term Residential Facility",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1014",
  },
  {
    type: "depends-on",
    display: "Value set Audiology Visit",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1066",
  },
  {
    type: "depends-on",
    display: "Value set Telephone Visits",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1080",
  },
  {
    type: "depends-on",
    display: "Value set Virtual Encounter",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.101.12.1089",
  },
  {
    type: "depends-on",
    display: "Value set Physical Therapy Evaluation",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.3.1022",
  },
  {
    type: "depends-on",
    display: "Value set Occupational Therapy Evaluation",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.3.1011",
  },
  {
    type: "depends-on",
    display: "Value set Encounter Inpatient",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.666.5.307",
  },
  {
    type: "depends-on",
    display: "Value set Hospice Encounter",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.1003",
  },
  {
    type: "depends-on",
    display: "Value set Hospice Care Ambulatory",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.526.3.1584",
  },
  {
    type: "depends-on",
    display: "Value set Hospice Diagnosis",
    resource:
      "http://cts.nlm.nih.gov/fhir/ValueSet/2.16.840.1.113883.3.464.1003.1165",
  },
];

// Create output directory
const outputDir = path.join("input", "vocabulary", "valueset", "external");
fs.mkdirSync(outputDir, { recursive: true });

/**
 * Extract OID from ValueSet URL
 */
function extractOid(url) {
  return url.substring(url.lastIndexOf("/") + 1);
}

/**
 * Login to UMLS and download ValueSets using Puppeteer
 */
async function downloadValueSets(valueSets, apiKey, overwriteExisting = false) {
  console.log(`Starting download of ${valueSets.length} ValueSets...`);

  // Launch browser
  const browser = await puppeteer.launch({
    headless: "new", // Use new headless mode
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  try {
    const page = await browser.newPage();

    // Set viewport and user agent
    await page.setViewport({ width: 1280, height: 800 });
    await page.setUserAgent(
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
    );

    // First visit the login page
    console.log("Visiting UMLS login page...");
    await page.goto("https://cts.nlm.nih.gov/fhir/", {
      waitUntil: "networkidle2",
    });

    // Check if login form exists
    const loginFormExists = await page.evaluate(() => {
      return !!document.querySelector('form[action="login"]');
    });

    if (loginFormExists) {
      // Fill in the API key
      console.log("Filling in API key...");
      await page.type('input[name="password"]', apiKey);

      // Click login button
      console.log("Logging in...");
      await Promise.all([
        page.click("#btnLogin"),
        page.waitForNavigation({ waitUntil: "networkidle2" }),
      ]);

      console.log("Login completed. Checking authentication status...");

      // Check if we're logged in by looking for login form
      const stillOnLoginPage = await page.evaluate(() => {
        return !!document.querySelector('form[action="login"]');
      });

      if (stillOnLoginPage) {
        console.error("Login appears to have failed. Still on login page.");
        throw new Error("Authentication failed");
      }
    } else {
      console.log("No login form found. Proceeding without login.");
    }

    // Process each ValueSet
    let downloaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const valueSet of valueSets) {
      const oid = extractOid(valueSet.resource);
      const outputPath = path.join(outputDir, `${oid}.json`);

      // Skip if file exists and we're not overwriting
      if (fs.existsSync(outputPath) && !overwriteExisting) {
        console.log(`File already exists: ${outputPath} - Skipping`);
        skipped++;
        continue;
      }

      try {
        console.log(`Downloading ValueSet: ${valueSet.display} (${oid})`);

        // Go to the JSON URL directly
        const jsonUrl = `${valueSet.resource.replace(
          "http://",
          "https://"
        )}/$expand?_format=json`;
        console.log(`Navigating to: ${jsonUrl}`);

        const response = await page.goto(jsonUrl, {
          waitUntil: "networkidle2",
        });

        // Check if we got a JSON response
        const contentType = response.headers()["content-type"] || "";
        if (
          contentType.includes("json") ||
          contentType.includes("application/fhir")
        ) {
          // Get the page content
          const jsonContent = await page.content();

          // Extract the JSON from the page
          const jsonData = await page.evaluate(() => {
            try {
              // Try to get the pre text content if available
              const preElement = document.querySelector("pre");
              if (preElement) {
                return preElement.textContent;
              }
              // Otherwise get the body text
              return document.body.innerText;
            } catch (e) {
              return document.body.innerText;
            }
          });

          // Parse the JSON to validate it
          try {
            const valueSetData = JSON.parse(jsonData);

            // Verify it's a ValueSet
            if (valueSetData && valueSetData.resourceType === "ValueSet") {
              // Save the JSON file
              fs.writeFileSync(
                outputPath,
                JSON.stringify(valueSetData, null, 2)
              );
              console.log(`Successfully saved: ${outputPath}`);
              downloaded++;
            } else {
              console.error(`Response doesn't appear to be a ValueSet: ${oid}`);
              fs.writeFileSync(
                path.join(outputDir, `${oid}_error.json`),
                JSON.stringify(valueSetData, null, 2)
              );
              failed++;
            }
          } catch (parseError) {
            console.error(`Error parsing JSON for ${oid}:`, parseError.message);
            fs.writeFileSync(
              path.join(outputDir, `${oid}_error.txt`),
              jsonData
            );
            failed++;
          }
        } else {
          console.error(
            `Did not receive JSON for ${oid}. Content-Type: ${contentType}`
          );
          // Save the HTML response for debugging
          const htmlContent = await page.content();
          fs.writeFileSync(
            path.join(outputDir, `${oid}_error.html`),
            htmlContent
          );
          failed++;
        }
      } catch (error) {
        console.error(`Error downloading ${oid}:`, error.message);
        failed++;
      }

      // Delay between requests
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    console.log(`
ValueSet processing complete:
- Total: ${valueSets.length}
- Downloaded: ${downloaded}
- Skipped: ${skipped}
- Failed: ${failed}
    `);
  } finally {
    await browser.close();
  }
}

// Main function
async function main() {
  const apiKey = "2f4b6638-ee67-4ad2-9090-5fe8137a9b8d"; // Your API key
  const args = process.argv.slice(2);
  const overwriteFlag = args.includes("--overwrite") || args.includes("-o");

  try {
    await downloadValueSets(valueSetArray, apiKey, overwriteFlag);
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

// Run the script
main();
