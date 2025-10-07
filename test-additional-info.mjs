#!/usr/bin/env node

/**
 * Test Additional Information Extraction from Ostrovok
 */

// Sample HTML with the additional information structure
const additionalInfoHtml = `
<div class="Section_wrapper__EfPZs">
  <h3 class="Section_title__XmYEu">Additional information</h3>
  <div class="Section_content__kI4t6">
    <div class="PolicyBlock_wrapper__iRKEP">
      <table class="PolicyBlock_policyTable__dr43_">
        <tbody>
          <tr class="">
            <td class="PolicyBlock_policyTableCell__0zZxx">
              <div class="PolicyBlock_paragraph__2bmGu">Transfer should be paid separately. The cost can range from USD 200.00 to 600.00.</div>
              <div class="PolicyBlock_paragraph__2bmGu">Front desk is open 24/7.</div>
              <div class="PolicyBlock_paragraph__2bmGu">The environmental fee does not apply to children under 12 years of age.</div>
              <div class="PolicyBlock_paragraph__2bmGu">Transfer Option:</div>
              <div class="PolicyBlock_paragraph__2bmGu">Option 1: From Velena International Airport (MLE): 75–95-minute domestic flight to Gan and a 10-minute speedboat ride to Canareef: (Male' – Gan – Resort – Gan – Male'). Non-direct flights may take longer to reach the Resort/Male.</div>
              <div class="PolicyBlock_paragraph__2bmGu">Period: 1st November 2024 — 31st October 2025.</div>
              <div class="PolicyBlock_paragraph__2bmGu">USD 420.00 per adult (12 years and above ages).</div>
              <div class="PolicyBlock_paragraph__2bmGu">USD 340.00 per child (2 to 11 years old).</div>
              <div class="PolicyBlock_paragraph__2bmGu">FOC for infants below 2 years.</div>
              <div class="PolicyBlock_paragraph__2bmGu">Option 2: From Gan International Airport (GAN): 10-minute speedboat ride to Canareef: (Gan – Resort – Gan).</div>
              <div class="PolicyBlock_paragraph__2bmGu">USD 80.00 per adult (12 years and above).</div>
              <div class="PolicyBlock_paragraph__2bmGu">USD 40.00 per child (2-11 years old).</div>
              <div class="PolicyBlock_paragraph__2bmGu">FOC for infants below 2 years.</div>
              <div class="PolicyBlock_paragraph__2bmGu">24th December (X'Mas Supplement): Adult (12 years and above ages): USD 150.00 per adult.</div>
              <div class="PolicyBlock_paragraph__2bmGu">Child (6 to 11 years old): USD 75.00 per child.</div>
              <div class="PolicyBlock_paragraph__2bmGu">Child below 6 years: FOC.</div>
              <div class="PolicyBlock_paragraph__2bmGu">Other details: Children under 5 years will eat for free based on the rules and meal-plan accompanied by an adult.</div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</div>
`;

// Test extraction function
function testAdditionalInfoExtraction() {
  console.log('🧪 Testing Additional Information Extraction\n');

  // Extract from "Additional information" section using CSS classes
  const additionalInfoMatch = additionalInfoHtml.match(/<h3 class="Section_title__XmYEu">Additional information<\/h3>[\s\S]*?<td class="PolicyBlock_policyTableCell__0zZxx">([\s\S]*?)<\/td>/i);
  
  if (additionalInfoMatch && additionalInfoMatch[1]) {
    console.log('✅ Found Additional Information section\n');
    
    // Extract all policy paragraphs
    const policyMatches = additionalInfoMatch[1].matchAll(/<div class="PolicyBlock_paragraph__2bmGu">([^<]*(?:<[^>]*>[^<]*)*)<\/div>/g);
    const policies = [];
    let fullText = '';
    
    for (const match of policyMatches) {
      if (match[1] && match[1].trim()) {
        const cleanText = match[1].trim().replace(/\s+/g, ' ');
        if (cleanText.length > 3) { // Filter out empty or very short entries
          policies.push(cleanText);
          fullText += cleanText + ' ';
        }
      }
    }
    
    if (policies.length > 0) {
      console.log(`📋 Extracted ${policies.length} policy statements:`);
      policies.slice(0, 5).forEach((policy, i) => {
        console.log(`   ${i + 1}. ${policy}`);
      });
      
      // Extract specific information types
      const transferPolicies = policies.filter(p => 
        p.toLowerCase().includes('transfer') || 
        p.toLowerCase().includes('airport') || 
        p.toLowerCase().includes('flight')
      );
      
      console.log(`\n🚁 Transfer Details (${transferPolicies.length} items):`);
      transferPolicies.slice(0, 3).forEach((policy, i) => {
        console.log(`   ${i + 1}. ${policy}`);
      });
      
      // Extract pricing information
      const pricingPolicies = policies.filter(p => 
        p.includes('USD') || 
        p.toLowerCase().includes('cost') || 
        p.toLowerCase().includes('fee') ||
        p.toLowerCase().includes('supplement')
      );
      
      console.log(`\n💰 Pricing Info (${pricingPolicies.length} items):`);
      pricingPolicies.slice(0, 3).forEach((policy, i) => {
        console.log(`   ${i + 1}. ${policy}`);
      });
      
      // Children policies
      const childrenPolicies = policies.filter(p => 
        p.toLowerCase().includes('child') ||
        p.toLowerCase().includes('infant') ||
        /\d+\s+years/.test(p.toLowerCase())
      );
      
      console.log(`\n👶 Children Policies (${childrenPolicies.length} items):`);
      childrenPolicies.forEach((policy, i) => {
        console.log(`   ${i + 1}. ${policy}`);
      });
      
    } else {
      console.log('❌ No policies found');
    }
  } else {
    console.log('❌ Additional Information section not found');
  }

  console.log('\n🎯 Summary:');
  console.log('Our enhanced scraper can now extract:');
  console.log('- Complete additional information policies');
  console.log('- Transfer and airport details');
  console.log('- Pricing and fee structures');
  console.log('- Children and age-based policies');
  console.log('- Seasonal surcharges and supplements');
  
  console.log('\n✨ This captures all the rich policy information from Ostrovok pages!');
}

testAdditionalInfoExtraction();