import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import { formatCurrency } from './formatters';
import { FinancialProjection } from '../types/financial';
import { getShadingLabel } from './shadingLabels';
import { getOrientationCoefficient } from './orientationCoefficients';
import { getOrientationLabel } from './orientationMapping';

interface ClientInfo {
  nom: string;
  prenom: string;
  telephone: string;
  email: string;
  adresse: string;
  codePostal: string;
  ville: string;
  region: string;
  date: string;
  ensoleillement: string;
  conseiller: string;
  telephoneConseiller: string;
  commentaire: string;
  coordinates?: {
    lat: number;
    lon: number;
  };
  civilite: string;
  pdl?: string;
}

interface InstallationInfo {
  typeCompteur: string;
  consommationAnnuelle: number;
  orientation: number;
  inclinaison: number;
  masqueSolaire: number;
  puissanceCrete: number;
  degradationPanneau: number;
  nombreModules?: number;
  surfaceTotale?: number;
  pertes?: number;
}

interface PricingItem {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

interface SubscriptionDetails {
  monthlyPayment: number;
  duration: number;
  deposit?: number;
}

interface PricingData {
  financingMode: 'cash' | 'subscription';
  items: PricingItem[];
  totalPrice: number;
  subscriptionDetails?: SubscriptionDetails | null;
  promoCode?: string;
  promoValue?: number;
}

// Function to validate base64 string
function isValidBase64(str: string): boolean {
  try {
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(str)) {
      return false;
    }
    const decoded = atob(str);
    const encoded = btoa(decoded);
    return encoded === str;
  } catch (e) {
    return false;
  }
}

// Function to sanitize text for PDF encoding
function sanitizeText(text: string | number | undefined | null): string {
  if (text == null) {
    return '';
  }
  
  if (typeof text === 'number') {
    return text.toString();
  }
  
  if (typeof text !== 'string') {
    return '';
  }
  
  return text
    .replace(/[\u202F\u2007\u2008\u2009\u200A\u00A0\u2002-\u2006\u205F]/g, ' ')
    .replace(/[\u2080-\u2089]/g, (match) => String.fromCharCode(match.charCodeAt(0) - 0x2080 + 48))
    .replace(/CO₂/g, "CO2")
    .replace(/₂/g, '2')
    .replace(/²/g, '2')
    .replace(/₀/g, '0')
    .replace(/₁/g, '1')
    .replace(/₃/g, '3')
    .replace(/₄/g, '4')
    .replace(/₅/g, '5')
    .replace(/₆/g, '6')
    .replace(/₇/g, '7')
    .replace(/₈/g, '8')
    .replace(/₉/g, '9')
    .replace(/ʳ/g, 'r')
    .replace(/ᵉ/g, 'e')
    .replace(/ᵈ/g, 'd')
    .replace(/ᵗ/g, 't')
    .replace(/ᵃ/g, 'a')
    .replace(/ᵇ/g, 'b')
    .replace(/ᶜ/g, 'c')
    .replace(/ᵐ/g, 'm')
    .replace(/ⁿ/g, 'n')
    .replace(/ᵒ/g, 'o')
    .replace(/ᵖ/g, 'p')
    .replace(/ˢ/g, 's')
    .replace(/ᵘ/g, 'u')
    .replace(/ᵛ/g, 'v')
    .replace(/ʷ/g, 'w')
    .replace(/ˣ/g, 'x')
    .replace(/ʸ/g, 'y')
    .replace(/ᶻ/g, 'z')
    .replace(/1ʳᵉ année/g, '1re annee');
}

// Helper function to safely set form field text
function safeSetTextField(form: any, fieldName: string, value: string): void {
  try {
    const field = form.getTextField(fieldName);
    if (field) {
      field.setText(sanitizeText(value));
      // Augmenter la taille de la police pour les champs client
      if (fieldName.startsWith('Text') && parseInt(fieldName.substring(4)) <= 8) {
        field.setFontSize(12); // Augmenter la taille de la police pour les informations client
      }
      // Supprimer les bordures des champs
      field.setBorderWidth(0);
    }
  } catch (error) {
    console.warn(`Field "${fieldName}" not found in PDF template`);
  }
}

// Get pricing data from localStorage
function getPricingDataFromStorage(): PricingData | null {
  try {
    // Get financial mode
    const financingMode = localStorage.getItem('financialMode') as 'cash' | 'subscription' || 'cash';
    
    // Get base price
    const solarResults = localStorage.getItem('solarResults');
    let basePrice = 0;
    let puissanceCrete = 0;
    
    if (solarResults) {
      const results = JSON.parse(solarResults);
      puissanceCrete = results.puissanceCrete || 0;
      
      // Get installation prices from localStorage
      const savedPrices = localStorage.getItem('installation_prices');
      const customPrices = savedPrices ? JSON.parse(savedPrices) : [];
      
      // Find price for this power
      const exactMatch = customPrices.find((p: any) => Math.abs(p.power - puissanceCrete) < 0.01);
      if (exactMatch) {
        basePrice = exactMatch.price;
      } else {
        // Default prices if no custom price found
        const defaultPrices: { [key: number]: number } = {
          2.5: 6890, 3.0: 7890, 3.5: 8890, 4.0: 9890, 4.5: 10890,
          5.0: 11890, 5.5: 12890, 6.0: 14890, 6.5: 15890, 7.0: 16890,
          7.5: 17890, 8.0: 18890, 8.5: 19890, 9.0: 19890
        };
        
        // Round to nearest 0.5
        const roundedPower = Math.round(puissanceCrete * 2) / 2;
        basePrice = defaultPrices[roundedPower] || 0;
      }
    }
    
    // Get subsidy
    const primeAutoconsommation = parseFloat(localStorage.getItem('primeAutoconsommation') || '0');
    
    // Get commercial discount
    const remiseCommerciale = parseFloat(localStorage.getItem('remiseCommerciale') || '0');
    
    // Get battery selection
    const batterySelection = localStorage.getItem('batterySelection');
    let batteryPrice = 0;
    let batteryType = null;
    let smartChargerPrice = 0;
    let myLightPrice = 0;
    let myBatterySetupFee = 0;
    let smartBatterySetupFee = 0;
    
    if (batterySelection) {
      const battery = JSON.parse(batterySelection);
      batteryType = battery.type;
      
      if (battery.type === 'physical' && battery.model) {
        batteryPrice = battery.model.oneTimePrice || 0;
      } else if (battery.type === 'virtual') {
        // Smart Battery costs - monthly subscription only, no setup fee
        smartBatterySetupFee = 2000;
        
        if (battery.includeSmartCharger) {
          smartChargerPrice = 1500;
        }
        
        // MyLight monthly price based on capacity
        const capacity = battery.virtualCapacity || 0;
        myLightPrice = capacity === 100 ? 180 :
                      capacity === 300 ? 288 :
                      capacity === 600 ? 360 : 420;
      } else if (battery.type === 'mybattery') {
        // MyBattery: 1.055€/kWc/month, no setup fee
        myBatterySetupFee = 179;
        myLightPrice = puissanceCrete * 1.055 * 12; // Annual cost
      }
    }
    
    // Get inverter type
    const inverterType = localStorage.getItem('inverterType') || 'central';
    let enphasePrice = 0;
    
    if (inverterType === 'enphase') {
      // Calculate Enphase cost
      if (puissanceCrete <= 3) {
        enphasePrice = 1500;
      } else if (puissanceCrete <= 6) {
        enphasePrice = 1800;
      } else {
        enphasePrice = 2200;
      }
    }
    
    // Get mounting system
    const mountingSystem = localStorage.getItem('mountingSystem') || 'surimposition';
    let mountingSystemCost = 0;
    
    if (mountingSystem !== 'surimposition') {
      // Calculate number of panels
      const numberOfPanels = Math.ceil(puissanceCrete * 2);
      
      if (mountingSystem === 'bac-lestes') {
        mountingSystemCost = 60 * numberOfPanels;
      } else if (mountingSystem === 'integration') {
        mountingSystemCost = 100 * numberOfPanels;
      }
    }
    
    // Get Ecojoko option
    const includeEcojoko = localStorage.getItem('includeEcojoko') === 'true';
    const freeEcojoko = localStorage.getItem('freeEcojoko') === 'true';
    const ecojokoPrice = includeEcojoko && !freeEcojoko ? 229 : 0;
    
    // Get promo code information
    const appliedPromoCodes = localStorage.getItem('applied_promo_codes');
    const promoDiscount = parseFloat(localStorage.getItem('promo_discount') || '0');
    const freeMonths = parseInt(localStorage.getItem('promo_free_months') || '0', 10);
    const freeDeposit = localStorage.getItem('promo_free_deposit') === 'true';
    const freeBatterySetup = localStorage.getItem('promo_free_battery_setup') === 'true';
    const freeSmartBatterySetup = localStorage.getItem('promo_free_smart_battery_setup') === 'true';
    
    // Get promo code text
    let promoCode = '';
    if (appliedPromoCodes) {
      try {
        const codes = JSON.parse(appliedPromoCodes);
        if (Array.isArray(codes) && codes.length > 0) {
          promoCode = codes.join(', ');
        }
      } catch (e) {
        console.error('Error parsing promo codes:', e);
      }
    }
    
    // Get subscription details if applicable
    let subscriptionDetails = undefined;
    
    if (financingMode === 'subscription') {
      const duration = parseInt(localStorage.getItem('subscriptionDuration') || '20', 10);
      
      // Subscription price table
      const subscriptionTable: {[key: string]: {[key: number]: number}} = {
        '25': {
          2.5: 49.00, 3.0: 59.00, 3.5: 68.50, 4.0: 78.00, 4.5: 87.00,
          5.0: 96.00, 5.5: 105.50, 6.0: 115.00, 6.5: 124.00,
          7.0: 132.00, 7.5: 140.00, 8.0: 149.00, 8.5: 158.00, 9.0: 167.00
        },
        '20': {
          2.5: 51.60, 3.0: 63.60, 3.5: 72.00, 4.0: 82.80, 4.5: 92.00,
          5.0: 100.80, 5.5: 111.60, 6.0: 120.00, 6.5: 129.60,
          7.0: 138.00, 7.5: 146.40, 8.0: 156.00, 8.5: 164.40, 9.0: 174.00
        },
        '15': {
          2.5: 56.40, 3.0: 73.20, 3.5: 80.40, 4.0: 91.20, 4.5: 102.00,
          5.0: 111.60, 5.5: 122.40, 6.0: 130.80, 6.5: 142.80,
          7.0: 150.00, 7.5: 159.60, 8.0: 169.20, 8.5: 177.60, 9.0: 189.60
        },
        '10': {
          2.5: 67.20, 3.0: 86.40, 3.5: 97.20, 4.0: 106.80, 4.5: 120.00,
          5.0: 134.40, 5.5: 144.00, 6.0: 153.60, 6.5: 165.60,
          7.0: 174.00, 7.5: 178.80, 8.0: 192.00, 8.5: 200.40, 9.0: 206.40
        }
      };
      
      // Round power to nearest 0.5
      const roundedPower = Math.round(puissanceCrete * 2) / 2;
      const monthlyPayment = subscriptionTable[duration.toString()]?.[roundedPower] || 0;
      
      // Calculate deposit (2 months) - ONLY based on subscription price, not including MyLight
      const deposit = monthlyPayment * 2;
      
      subscriptionDetails = {
        monthlyPayment,
        duration,
        deposit: freeDeposit ? 0 : deposit
      };
    }
    
    // Build pricing items
    const items: PricingItem[] = [];
    
    if (financingMode === 'cash') {
      // Cash purchase items
      items.push({
        description: `Installation photovoltaïque ${puissanceCrete.toFixed(1)} kWc`,
        quantity: 1,
        unitPrice: basePrice,
        totalPrice: basePrice
      });
      
      if (enphasePrice > 0) {
        items.push({
          description: 'Option micro-onduleurs Enphase',
          quantity: 1,
          unitPrice: enphasePrice,
          totalPrice: enphasePrice
        });
      } else if (inverterType === 'solenso') {
        items.push({
          description: 'Option micro-onduleurs Solenso',
          quantity: 1,
          unitPrice: 0,
          totalPrice: 0
        });
      }
      
      if (mountingSystemCost > 0) {
        items.push({
          description: mountingSystem === 'bac-lestes' ? 'Système bac lestés' : 'Intégration au bâti',
          quantity: 1,
          unitPrice: mountingSystemCost,
          totalPrice: mountingSystemCost
        });
      }
      
      if (batteryPrice > 0) {
        items.push({
          description: 'Batterie physique',
          quantity: 1,
          unitPrice: batteryPrice,
          totalPrice: batteryPrice
        });
      }
      
      if (smartChargerPrice > 0) {
        items.push({
          description: 'Smart Charger',
          quantity: 1,
          unitPrice: smartChargerPrice,
          totalPrice: smartChargerPrice
        });
      }
      
      if (myBatterySetupFee > 0) {
        items.push({
          description: 'Frais d\'activation MyBattery',
          quantity: 1,
          unitPrice: freeBatterySetup ? 0 : myBatterySetupFee,
          totalPrice: freeBatterySetup ? 0 : myBatterySetupFee
        });
      }
      
      if (smartBatterySetupFee > 0) {
        items.push({
          description: 'Frais de mise en service SmartBattery',
          quantity: 1,
          unitPrice: freeSmartBatterySetup ? 0 : smartBatterySetupFee,
          totalPrice: freeSmartBatterySetup ? 0 : smartBatterySetupFee
        });
      }
      
      // Ajouter l'option Ecojoko si sélectionnée
      if (includeEcojoko) {
        items.push({
          description: 'Option Ecojoko',
          quantity: 1,
          unitPrice: freeEcojoko ? 0 : 229,
          totalPrice: freeEcojoko ? 0 : 229
        });
      }
      
      if (primeAutoconsommation > 0) {
        items.push({
          description: 'Prime à l\'autoconsommation',
          quantity: 1,
          unitPrice: -primeAutoconsommation,
          totalPrice: -primeAutoconsommation
        });
      }
      
      if (remiseCommerciale > 0) {
        items.push({
          description: 'Remise commerciale',
          quantity: 1,
          unitPrice: -remiseCommerciale,
          totalPrice: -remiseCommerciale
        });
      }
    } else {
      // Subscription items
      if (subscriptionDetails) {
        items.push({
          description: `Abonnement mensuel (${subscriptionDetails.duration} ans)`,
          quantity: 1,
          unitPrice: subscriptionDetails.monthlyPayment,
          totalPrice: subscriptionDetails.monthlyPayment
        });
        
        if (subscriptionDetails.deposit && subscriptionDetails.deposit > 0) {
          items.push({
            description: 'Dépôt de garantie (remboursable)',
            quantity: 1,
            unitPrice: subscriptionDetails.deposit,
            totalPrice: subscriptionDetails.deposit
          });
        }
      }
      
      if (myBatterySetupFee > 0) {
        items.push({
          description: 'Frais d\'activation MyBattery',
          quantity: 1,
          unitPrice: freeBatterySetup ? 0 : myBatterySetupFee,
          totalPrice: freeBatterySetup ? 0 : myBatterySetupFee
        });
      }
      
      if (smartBatterySetupFee > 0) {
        items.push({
          description: 'Frais de mise en service SmartBattery',
          quantity: 1,
          unitPrice: freeSmartBatterySetup ? 0 : smartBatterySetupFee,
          totalPrice: freeSmartBatterySetup ? 0 : smartBatterySetupFee
        });
      }
      
      // Ajouter l'option Ecojoko si sélectionnée
      if (includeEcojoko) {
        items.push({
          description: 'Option Ecojoko',
          quantity: 1,
          unitPrice: freeEcojoko ? 0 : 229,
          totalPrice: freeEcojoko ? 0 : 229
        });
      }
      
      if (myLightPrice > 0) {
        items.push({
          description: batteryType === 'virtual' ? 'Abonnement SmartBattery (annuel)' : 'Abonnement MyBattery (annuel)',
          quantity: 1,
          unitPrice: myLightPrice,
          totalPrice: myLightPrice
        });
      }
    }
    
    // Calculate total
    const totalPrice = items.reduce((sum, item) => sum + item.totalPrice, 0);
    
    return {
      financingMode,
      items,
      totalPrice,
      subscriptionDetails,
      promoCode: promoCode,
      promoValue: promoDiscount > 0 ? -promoDiscount : 0
    };
  } catch (error) {
    console.error('Error getting pricing data:', error);
    return null;
  }
}

/**
 * Loads a PDF template and fills its form fields with client and installation data
 */
export async function fillPdfForm(
  templateUrl: string,
  clientInfo: ClientInfo,
  installation: InstallationInfo,
  mapImageData?: string | null,
  projection?: FinancialProjection,
  selectedDatasheets?: string[]
): Promise<Uint8Array> {
  try {
    if (!templateUrl) {
      throw new Error('Template URL is required');
    }

    console.log('Fetching PDF template from:', templateUrl);

    const response = await fetch(templateUrl, {
      method: 'GET',
      headers: {
        'Accept': 'application/pdf',
        'Cache-Control': 'no-cache'
      },
      mode: 'cors'
    });
    
    if (!response.ok) {
      throw new Error(
        `Failed to fetch PDF template: ${response.status} ${response.statusText}. ` +
        `Make sure the template URL is accessible and CORS is properly configured.`
      );
    }

    const templateBytes = await response.arrayBuffer();
    if (!templateBytes || templateBytes.byteLength === 0) {
      throw new Error('PDF template is empty');
    }

    console.log('PDF template fetched successfully, size:', templateBytes.byteLength);

    const pdfDoc = await PDFDocument.load(templateBytes);
    pdfDoc.registerFontkit(fontkit);
    const form = pdfDoc.getForm();
    const pages = pdfDoc.getPages();
    
    // Fill client information fields (Page 2)
    try {
      console.log('Filling client information fields (Page 2)');
      safeSetTextField(form, 'Text1', clientInfo.nom);
      safeSetTextField(form, 'Text2', clientInfo.prenom);
      safeSetTextField(form, 'Text3', clientInfo.telephone);
      safeSetTextField(form, 'Text4', clientInfo.email);
      safeSetTextField(form, 'Text5', clientInfo.adresse);
      safeSetTextField(form, 'Text6', clientInfo.codePostal);
      safeSetTextField(form, 'Text7', clientInfo.ville);
      safeSetTextField(form, 'Text8', clientInfo.region);
      
      console.log('Client information fields filled successfully');
    } catch (error) {
      console.error('Error filling client information fields:', error);
      throw new Error('Error filling client information fields: ' + (error instanceof Error ? error.message : String(error)));
    }
    
    // Fill technical data fields (Page 3)
    try {
      console.log('Filling technical data fields (Page 3)');
      
      // Using the correct field names as per the mapping provided
      safeSetTextField(form, 'Text9', `${installation.puissanceCrete.toFixed(1)} kWc`);
      
      const nombreModules = installation.nombreModules || Math.ceil(installation.puissanceCrete * 2);
      safeSetTextField(form, 'Text13', nombreModules.toString());
      
      const surfaceTotale = installation.surfaceTotale || (nombreModules * 2.25).toFixed(1);
      safeSetTextField(form, 'Text14', `${surfaceTotale} m²`);
      
      safeSetTextField(form, 'Text15', `${installation.inclinaison}°`);
      safeSetTextField(form, 'Text16', getOrientationLabel(installation.orientation));
      
      const coefficient = getOrientationCoefficient(installation.orientation, installation.inclinaison);
      safeSetTextField(form, 'Text17', coefficient.toFixed(2));
      
      safeSetTextField(form, 'Text18', getShadingLabel(installation.masqueSolaire));
      safeSetTextField(form, 'Text19', clientInfo.ensoleillement);
      
      const productionValue = projection ? Math.round(projection.projectionAnnuelle[0].production).toString() : 'N/A';
      safeSetTextField(form, 'Text20', `${productionValue} kWh/an`);
      
      safeSetTextField(form, 'Text21', installation.typeCompteur === 'monophase' ? 'Monophasé' : 'Triphasé');
      safeSetTextField(form, 'Text22', clientInfo.pdl || 'Non renseigné');
      safeSetTextField(form, 'Text23', `${installation.pertes || 14} %`);
      safeSetTextField(form, 'Text24', `${installation.degradationPanneau} %`);
      safeSetTextField(form, 'Text25', clientInfo.commentaire || '');
      
      console.log('Technical data fields filled successfully');
    } catch (error) {
      console.error('Error filling technical data fields:', error);
      throw new Error('Error filling technical data fields: ' + (error instanceof Error ? error.message : String(error)));
    }
    
    // Fill contact information (Page 8)
    try {
      console.log('Filling contact information fields (Page 8)');
      safeSetTextField(form, 'Text26', clientInfo.conseiller || '');
      safeSetTextField(form, 'Text27', clientInfo.telephoneConseiller || '');
      
      console.log('Contact information fields filled successfully');
    } catch (error) {
      console.warn('Error filling contact information fields:', error);
    }
    
    // Embed satellite image on page 3 if available
    if (mapImageData && typeof mapImageData === 'string') {
      try {
        console.log('Processing satellite image data');
        if (pages.length >= 3) {
          const page3 = pages[2];
          const { width, height } = page3.getSize();
          
          // Get the standard font for the title
          const titleFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          
          // Draw title for the satellite image
          const titleText = "Vue satellite";
          const titleX = 30; // Aligné à gauche avec l'image
          
          page3.drawText(titleText, {
            x: titleX,
            y: height - 130, // Position the title higher (remontée de 1cm supplémentaire)
            size: 14,
            font: titleFont,
            color: rgb(0.2, 0.4, 0.8)
          });
          
          // Check if the data is a URL or a data URL
          if (mapImageData.startsWith('data:image/')) {
            // It's a data URL, extract the base64 part
            const parts = mapImageData.split(',');
            if (parts.length === 2) {
              const base64Data = parts[1];
              
              if (isValidBase64(base64Data)) {
                const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));
                const image = await pdfDoc.embedPng(imageBytes);
                
                // Ajuster les dimensions et la position pour éviter de chevaucher le titre et le tableau
                // Titre est à environ height - 100, et le tableau commence à environ height - 350
                const maxWidth = width - 80;
                const maxHeight = 150; // Augmenté de 30 points
                const { width: imgWidth, height: imgHeight } = image.scale(1);
                
                const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
                const scaledWidth = imgWidth * ratio;
                const scaledHeight = imgHeight * ratio;
                
                // Centrer l'image horizontalement
                const imageX = 30; // Décalé à gauche
                
                // Dessiner un cadre autour de l'image avec une bordure plus visible
                page3.drawRectangle({
                  x: imageX - 4,
                  y: height - 160 - scaledHeight - 4, // Position remontée de 1cm supplémentaire
                  width: scaledWidth + 8,
                  height: scaledHeight + 8,
                  borderColor: rgb(0.5, 0.5, 0.8),
                  borderWidth: 2,
                  color: rgb(1, 1, 1)
                });
                
                // Positionner l'image entre le titre et le tableau, avec plus d'espace
                page3.drawImage(image, {
                  x: imageX,
                  y: height - 160 - scaledHeight, // Position remontée de 1cm supplémentaire
                  width: scaledWidth,
                  height: scaledHeight
                });
                
                console.log('Satellite image embedded successfully from data URL');
              } else {
                console.warn('Invalid base64 data in image data URL');
              }
            } else {
              console.warn('Invalid data URL format');
            }
          } else if (mapImageData.startsWith('http')) {
            // It's a URL, fetch the image
            console.log('Fetching satellite image from URL');
            try {
              const imgResponse = await fetch(mapImageData, {
                mode: 'cors',
                headers: {
                  'Accept': 'image/png,image/jpeg,image/*'
                }
              });
              
              if (!imgResponse.ok) {
                throw new Error(`Failed to fetch image: ${imgResponse.status}`);
              }
              
              const imgArrayBuffer = await imgResponse.arrayBuffer();
              const imgBytes = new Uint8Array(imgArrayBuffer);
              
              // Determine image type from content-type header
              const contentType = imgResponse.headers.get('content-type') || '';
              let image;
              
              if (contentType.includes('png')) {
                image = await pdfDoc.embedPng(imgBytes);
              } else if (contentType.includes('jpeg') || contentType.includes('jpg')) {
                image = await pdfDoc.embedJpg(imgBytes);
              } else {
                // Default to PNG
                image = await pdfDoc.embedPng(imgBytes);
              }
              
              // Ajuster les dimensions pour s'adapter entre le titre et le tableau
              const maxWidth = width - 80;
              const maxHeight = 150; // Augmenté de 30 points
              const { width: imgWidth, height: imgHeight } = image.scale(1);
              
              const ratio = Math.min(maxWidth / imgWidth, maxHeight / imgHeight);
              const scaledWidth = imgWidth * ratio;
              const scaledHeight = imgHeight * ratio;
              
              // Centrer l'image horizontalement
              const imageX = 30; // Décalé à gauche
              
              // Dessiner un cadre autour de l'image avec une bordure plus visible
              page3.drawRectangle({
                x: imageX - 4,
                y: height - 160 - scaledHeight - 4, // Position remontée de 1cm supplémentaire
                width: scaledWidth + 8,
                height: scaledHeight + 8,
                borderColor: rgb(0.5, 0.5, 0.8),
                borderWidth: 2,
                color: rgb(1, 1, 1)
              });
              
              // Positionner l'image entre le titre et le tableau, avec plus d'espace
              page3.drawImage(image, {
                x: imageX,
                y: height - 160 - scaledHeight, // Position remontée de 1cm supplémentaire
                width: scaledWidth,
                height: scaledHeight
              });
              
              console.log('Satellite image embedded successfully from URL');
            } catch (fetchError) {
              console.warn('Failed to fetch satellite image from URL:', fetchError);
            }
          } else {
            console.warn('Unrecognized image data format');
          }
        } else {
          console.warn('Page 3 not found in PDF template');
        }
      } catch (imageError) {
        console.warn('Failed to embed satellite image:', imageError);
      }
    } else {
      console.warn('No valid satellite image data provided');
    }
    
    // Add pricing table to page 4
    if (pages.length >= 4) {
      try {
        const page4 = pages[3];
        const { width: page4Width, height: page4Height } = page4.getSize();
        
        // Get pricing data from localStorage
        const pricingData = getPricingDataFromStorage();
        
        if (pricingData) {
          // Get the standard font
          const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
          const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          
          // Adjusted position - moved up to center between title and reviews
          const tableX = 50;
          const tableY = page4Height - 220; // Moved up from 300 to 220
          const tableWidth = page4Width - 100;
          const rowHeight = 30;
          const headerHeight = 35;
          
          const headerBgColor = rgb(0.95, 0.95, 0.95);
          const borderColor = rgb(0.8, 0.8, 0.8);
          const textColor = rgb(0.2, 0.2, 0.2);
          const totalRowBgColor = rgb(0.9, 0.95, 1);
          
          // Draw table title
          page4.drawText("Récapitulatif financier", {
            x: tableX,
            y: tableY + headerHeight + 20,
            size: 16,
            font: boldFont,
            color: rgb(0.2, 0.4, 0.8),
          });
          
          // Adjusted column widths for better alignment
          const colWidths = [0.5, 0.15, 0.15, 0.2].map(w => w * tableWidth);
          
          // Draw table header
          page4.drawRectangle({
            x: tableX,
            y: tableY,
            width: tableWidth,
            height: headerHeight,
            color: headerBgColor,
            borderColor: borderColor,
            borderWidth: 1,
          });
          
          // Draw header text
          const headerTexts = ["Description", "Qté", "Prix unitaire", "Total TTC"];
          
          // Pre-embed fonts for header texts
          const embeddedBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          
          // Draw header text with proper alignment
          for (let i = 0; i < headerTexts.length; i++) {
            const headerText = headerTexts[i];
            let textX;
            
            if (i === 0) {
              // Left align "Description"
              textX = tableX + 10;
            } else if (i === 1) {
              // Center align "Qté"
              textX = tableX + colWidths[0] + (colWidths[1] / 2) - (embeddedBoldFont.widthOfTextAtSize(headerText, 12) / 2);
            } else {
              // Right align "Prix unitaire" and "Total TTC"
              const colStart = tableX + colWidths.slice(0, i).reduce((sum, w) => sum + w, 0);
              textX = colStart + (colWidths[i] / 2) - (embeddedBoldFont.widthOfTextAtSize(headerText, 12) / 2);
            }
            
            page4.drawText(headerText, {
              x: textX,
              y: tableY + headerHeight/2 - 6,
              size: 12,
              font: embeddedBoldFont,
              color: textColor,
            });
          }
          
          // Draw table rows
          if (pricingData.items.length > 0) {
            for (let row = 0; row < pricingData.items.length; row++) {
              const item = pricingData.items[row];
              const rowY = tableY - ((row + 1) * rowHeight);
              
              page4.drawRectangle({
                x: tableX,
                y: rowY,
                width: tableWidth,
                height: rowHeight,
                color: rgb(1, 1, 1),
                borderColor: borderColor,
                borderWidth: 1,
              });
              
              // Description (left aligned)
              page4.drawText(sanitizeText(item.description), {
                x: tableX + 10,
                y: rowY + rowHeight/2 - 6,
                size: 11,
                font: font,
                color: textColor,
              });
              
              // Quantity (center aligned)
              const qtyText = item.quantity.toString();
              const qtyWidth = font.widthOfTextAtSize(qtyText, 11);
              const qtyX = tableX + colWidths[0] + (colWidths[1] / 2) - (qtyWidth / 2);
              page4.drawText(qtyText, {
                x: qtyX,
                y: rowY + rowHeight/2 - 6,
                size: 11,
                font: font,
                color: textColor,
              });
              
              // Unit price (right aligned)
              const unitPriceText = formatCurrency(item.unitPrice);
              const unitPriceWidth = font.widthOfTextAtSize(unitPriceText, 11);
              const unitPriceX = tableX + colWidths[0] + colWidths[1] + (colWidths[2] / 2) - (unitPriceWidth / 2);
              page4.drawText(unitPriceText, {
                x: unitPriceX,
                y: rowY + rowHeight/2 - 6,
                size: 11,
                font: font,
                color: textColor,
              });
              
              // Total price (right aligned)
              const totalPriceText = formatCurrency(item.totalPrice);
              const totalPriceWidth = font.widthOfTextAtSize(totalPriceText, 11);
              const totalPriceX = tableX + colWidths[0] + colWidths[1] + colWidths[2] + (colWidths[3] / 2) - (totalPriceWidth / 2);
              page4.drawText(totalPriceText, {
                x: totalPriceX,
                y: rowY + rowHeight/2 - 6,
                size: 11,
                font: font,
                color: textColor,
              });
            }
            
            // Draw total row
            const totalRowY = tableY - ((pricingData.items.length + 1) * rowHeight);
            
            page4.drawRectangle({
              x: tableX,
              y: totalRowY,
              width: tableWidth,
              height: rowHeight,
              color: totalRowBgColor,
              borderColor: borderColor,
              borderWidth: 1,
            });
            
            // Total label
            page4.drawText("Total", {
              x: tableX + 10,
              y: totalRowY + rowHeight/2 - 6,
              size: 12,
              font: boldFont,
              color: textColor,
            });
            
            // Total amount (right aligned in the last column)
            const totalText = formatCurrency(pricingData.totalPrice);
            const totalWidth = boldFont.widthOfTextAtSize(totalText, 12);
            const totalX = tableX + colWidths[0] + colWidths[1] + colWidths[2] + (colWidths[3] / 2) - (totalWidth / 2);
            page4.drawText(totalText, {
              x: totalX,
              y: totalRowY + rowHeight/2 - 6,
              size: 12,
              font: boldFont,
              color: textColor,
            });
            
            // Add promo code information if available
            if (pricingData.promoCode && pricingData.promoValue && pricingData.promoValue < 0) {
              const promoY = totalRowY - 20;
              
              // Draw promo code label
              page4.drawText(`Code promo : ${pricingData.promoCode}`, {
                x: tableX + 10,
                y: promoY,
                size: 10,
                font: boldFont,
                color: textColor,
              });
              
              // Draw promo value
              const promoValueText = formatCurrency(pricingData.promoValue);
              const promoValueWidth = font.widthOfTextAtSize(promoValueText, 10);
              const promoValueX = tableX + colWidths[0] + colWidths[1] + colWidths[2] + (colWidths[3] / 2) - (promoValueWidth / 2);
              
              page4.drawText(promoValueText, {
                x: promoValueX,
                y: promoY,
                size: 10,
                font: boldFont,
                color: rgb(0.8, 0, 0),
              });
            }
            
            // Add subscription note if applicable
            if (pricingData.financingMode === 'subscription' && pricingData.subscriptionDetails) {
              const noteY = totalRowY - (pricingData.promoCode ? 40 : 20);
              
              const noteText = `Note: Abonnement mensuel de ${formatCurrency(pricingData.subscriptionDetails.monthlyPayment)} sur ${pricingData.subscriptionDetails.duration} ans.`;
              
              page4.drawText(noteText, {
                x: tableX + 10,
                y: noteY,
                size: 9,
                font: font,
                color: textColor,
              });
            }
          }
        }
      } catch (error) {
        console.warn('Error adding pricing table:', error);
      }
    }
    
    // Add financial projection table to page 5
    if (pages.length >= 5 && projection) {
      try {
        const page5 = pages[4];
        const { width: page5Width, height: page5Height } = page5.getSize();
        
        // Check if we have a captured projection image
        const projectionPng = localStorage.getItem('projection20ans_png');
        if (projectionPng) {
          try {
            // Split the data URL to get the base64 part
            const parts = projectionPng.split(',');
            if (parts.length === 2) {
              const pngBase64 = parts[1];
              const pngBytes = Uint8Array.from(atob(pngBase64), c => c.charCodeAt(0));
              const img = await pdfDoc.embedPng(pngBytes);
              
              // Calculate image dimensions to fit the page width while maintaining aspect ratio
              const { width: imgWidth, height: imgHeight } = img.scale(1);
              const maxWidth = page5Width - 80;
              
              // Réduire la hauteur maximale pour laisser plus d'espace en bas
              const maxHeight = page5Height - 250; // Réduit davantage pour éviter de chevaucher le texte de fin
              
              // Calculer le ratio en tenant compte des deux contraintes
              const scaleWidth = maxWidth / imgWidth;
              const scaleHeight = maxHeight / imgHeight;
              const scale = Math.min(scaleWidth, scaleHeight);
              
              const drawWidth = imgWidth * scale;
              const drawHeight = imgHeight * scale;
              
              // Draw the image - Moved up by 1cm (28.35 points)
              page5.drawImage(img, {
                x: 40,
                y: page5Height - 120 - drawHeight, // Moved up by 1cm (28.35 points)
                width: drawWidth,
                height: drawHeight
              });
              
              console.log('Projection image embedded successfully with adjusted size');
            }
          } catch (imgError) {
            console.warn('Failed to embed projection image:', imgError);
            // If image embedding fails, we'll draw the table manually below
          }
        } else {
          // If no image is available, draw the table manually
          // Draw table headers - Moved up by 1cm (28.35 points)
          const tableX = 40;
          const tableY = page5Height - 120; // Moved up by 1cm (28.35 points)
          const tableWidth = page5Width - 80;
          const rowHeight = 22;
          const headerHeight = 28;
          
          // Define columns based on financing mode
          const isSubscription = projection.projectionAnnuelle[0].coutAbonnement > 0;
          const columns = isSubscription 
            ? ["Année", "Production", "Économies", "Revente", "Abonnement", "Gain annuel", "Gain cumulé"]
            : ["Année", "Production", "Économies", "Revente", "Gain annuel", "Gain cumulé"];
          
          const colCount = columns.length;
          const colWidth = tableWidth / colCount;
          
          // Draw table header
          page5.drawRectangle({
            x: tableX,
            y: tableY,
            width: tableWidth,
            height: headerHeight,
            color: rgb(0.9, 0.9, 0.95),
            borderColor: rgb(0.8, 0.8, 0.8),
            borderWidth: 1
          });
          
          // Pre-embed fonts for header texts
          const embeddedBoldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
          const embeddedFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
          
          // Draw header texts with larger font size
          for (let i = 0; i < columns.length; i++) {
            const col = columns[i];
            const textWidth = embeddedBoldFont.widthOfTextAtSize(col, 11);
            const textX = tableX + (i * colWidth) + (colWidth / 2) - (textWidth / 2);
            page5.drawText(col, {
              x: textX,
              y: tableY + headerHeight/2 - 5,
              size: 11,
              font: embeddedBoldFont,
              color: rgb(0.2, 0.2, 0.2)
            });
          }
          
          // Draw rows (limit to 20 years)
          let cumulativeGain = 0;
          const maxRows = Math.min(20, projection.projectionAnnuelle.length);
          
          for (let i = 0; i < maxRows; i++) {
            const year = projection.projectionAnnuelle[i];
            cumulativeGain += year.gainTotal;
            
            const rowY = tableY - ((i + 1) * rowHeight);
            
            // Draw row background (alternating colors)
            page5.drawRectangle({
              x: tableX,
              y: rowY,
              width: tableWidth,
              height: rowHeight,
              color: i % 2 === 0 ? rgb(1, 1, 1) : rgb(0.97, 0.97, 0.97),
              borderColor: rgb(0.8, 0.8, 0.8),
              borderWidth: 1
            });
            
            // Draw cell values
            const values = [
              year.annee.toString(),
              Math.round(year.production).toString(),
              formatCurrency(year.economiesAutoconsommation),
              formatCurrency(year.revenusRevente)
            ];
            
            // Add subscription cost if applicable
            if (isSubscription) {
              values.push(formatCurrency(-year.coutAbonnement));
            }
            
            // Add gain columns
            values.push(formatCurrency(year.gainTotal));
            values.push(formatCurrency(cumulativeGain));
            
            // Draw each cell with smaller font size
            for (let j = 0; j < values.length; j++) {
              const value = values[j];
              const cellWidth = embeddedFont.widthOfTextAtSize(value, 10);
              const cellX = tableX + (j * colWidth) + (colWidth / 2) - (cellWidth / 2);
              page5.drawText(value, {
                x: cellX,
                y: rowY + rowHeight/2 - 5,
                size: 10,
                font: embeddedFont,
                color: rgb(0.2, 0.2, 0.2)
              });
            }
          }
        }
      } catch (error) {
        console.warn('Error adding financial projection table:', error);
      }
    }
    
    // Append technical datasheets if selected
    if (selectedDatasheets && selectedDatasheets.length > 0) {
      try {
        console.log('Appending technical datasheets:', selectedDatasheets);
        
        // Get technical datasheets from localStorage
        const datasheets = localStorage.getItem('technical_datasheets');
        if (datasheets) {
          const datasheetsList = JSON.parse(datasheets);
          
          for (const datasheetId of selectedDatasheets) {
            const datasheet = datasheetsList.find((ds: any) => ds.id === datasheetId);
            if (datasheet && datasheet.url) {
              try {
                console.log(`Fetching datasheet: ${datasheet.name} from ${datasheet.url}`);
                
                // Fetch the datasheet PDF
                const datasheetResponse = await fetch(datasheet.url, {
                  method: 'GET',
                  headers: {
                    'Accept': 'application/pdf',
                    'Cache-Control': 'no-cache'
                  },
                  mode: 'cors'
                });
                
                if (!datasheetResponse.ok) {
                  console.warn(`Failed to fetch datasheet: ${datasheetResponse.status} ${datasheetResponse.statusText}`);
                  continue;
                }
                
                const datasheetBytes = await datasheetResponse.arrayBuffer();
                if (!datasheetBytes || datasheetBytes.byteLength === 0) {
                  console.warn('Datasheet PDF is empty');
                  continue;
                }
                
                // Load the datasheet PDF
                const datasheetDoc = await PDFDocument.load(datasheetBytes);
                
                // Copy all pages from the datasheet
                const copiedPages = await pdfDoc.copyPages(
                  datasheetDoc, 
                  datasheetDoc.getPageIndices()
                );
                
                // Add each copied page to the main document
                copiedPages.forEach(page => {
                  pdfDoc.addPage(page);
                });
                
                console.log(`Successfully appended datasheet: ${datasheet.name}`);
              } catch (datasheetError) {
                console.warn(`Error appending datasheet ${datasheet.name}:`, datasheetError);
              }
            }
          }
        }
      } catch (error) {
        console.warn('Error appending technical datasheets:', error);
      }
    }
    
    // Flatten the form to make it non-editable
    try {
      form.flatten();
    } catch (flattenError) {
      console.warn('Error flattening form:', flattenError);
    }
    
    return await pdfDoc.save();
  } catch (error) {
    console.error('Error filling PDF form:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    throw new Error(`Failed to generate PDF report: ${errorMessage}`);
  }
}

/**
 * Creates a download link for the generated PDF
 */
export function downloadPdf(pdfBytes: Uint8Array, filename: string = 'rapport-installation-solaire.pdf'): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

/**
 * Opens the PDF in a new tab for preview
 */
export function previewPdf(pdfBytes: Uint8Array): void {
  const blob = new Blob([pdfBytes], { type: 'application/pdf' });
  const url = URL.createObjectURL(blob);
  
  window.open(url, '_blank');
  
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}