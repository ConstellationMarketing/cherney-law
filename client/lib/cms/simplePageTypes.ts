/**
 * Simple Page Content Type
 * Used for pages like Privacy Policy, Terms of Service, Disclaimer
 */

export interface SimplePageContent {
  title: string;
  body: string; // Rich HTML content
}

// Default content for Privacy Policy
export const defaultPrivacyPolicyContent: SimplePageContent = {
  title: "Privacy Policy",
  body: `<h2>Privacy Policy</h2>
<p>Last Updated: ${new Date().toLocaleDateString()}</p>

<h3>Introduction</h3>
<p>We are committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website and use our services.</p>

<h3>Information We Collect</h3>
<p>We may collect information about you in a variety of ways. The information we may collect on the site includes:</p>
<ul>
<li><strong>Personal Data:</strong> Name, email address, phone number, and other information you voluntarily submit</li>
<li><strong>Device Information:</strong> Browser type, operating system, and other technical data</li>
<li><strong>Usage Data:</strong> How you interact with our website and services</li>
</ul>

<h3>How We Use Your Information</h3>
<p>Having accurate information about you permits us to provide you with a smooth, efficient, and customized experience. Specifically, we may use information collected about you via the site to:</p>
<ul>
<li>Generate a personal profile about you so that future visits to the site will be tailored to your preferences</li>
<li>Increase the efficiency and operation of the site</li>
<li>Monitor and analyze usage and trends to improve your experience with the site</li>
<li>Respond to your inquiries about our services</li>
</ul>

<h3>Contact Us</h3>
<p>If you have questions or comments about this Privacy Policy, please contact us at your earliest convenience.</p>`,
};

// Default content for Terms of Service
export const defaultTermsOfServiceContent: SimplePageContent = {
  title: "Terms of Service",
  body: `<h2>Terms of Service</h2>
<p>Last Updated: ${new Date().toLocaleDateString()}</p>

<h3>Agreement to Terms</h3>
<p>By accessing and using this website, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.</p>

<h3>Use License</h3>
<p>Permission is granted to temporarily download one copy of the materials (information or software) on our website for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:</p>
<ul>
<li>Modify or copy the materials</li>
<li>Use the materials for any commercial purpose or for any public display</li>
<li>Attempt to decompile or reverse engineer any software contained on the website</li>
<li>Transfer the materials to another person or "mirror" the materials on any other server</li>
<li>Attempt to gain unauthorized access to any portion or feature of the website</li>
<li>Harass, abuse, or otherwise harm any person in connection with your use of the website</li>
</ul>

<h3>Disclaimer</h3>
<p>The materials on our website are provided on an 'as is' basis. We make no warranties, expressed or implied, and hereby disclaim and negate all other warranties including, without limitation, implied warranties or conditions of merchantability, fitness for a particular purpose, or non-infringement of intellectual property or other violation of rights.</p>

<h3>Limitations</h3>
<p>In no event shall our company or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on our website.</p>

<h3>Governing Law</h3>
<p>These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction where our business is located, and you irrevocably submit to the exclusive jurisdiction of the courts in that location.</p>`,
};

// Default content for Disclaimer
export const defaultDisclaimerContent: SimplePageContent = {
  title: "Disclaimer",
  body: `<h2>Disclaimer</h2>
<p>Last Updated: ${new Date().toLocaleDateString()}</p>

<h3>Legal Disclaimer</h3>
<p>The information provided on this website is for general informational purposes only and should not be construed as legal advice. The use of this website does not create an attorney-client relationship between you and our firm.</p>

<h3>No Guarantee of Results</h3>
<p>We make no warranty or guarantee regarding the outcome of any matter we undertake. Past results do not guarantee or predict future results. Every case is unique and depends on its own particular set of facts.</p>

<h3>Attorney Advertising</h3>
<p>This website may be considered attorney advertising in some jurisdictions. By accessing and using this website, you acknowledge and agree that you understand the limitations of the information provided here.</p>

<h3>Confidentiality</h3>
<p>Sending us an email does not establish an attorney-client relationship. Any information sent to us is not protected by attorney-client privilege unless and until a formal agreement for representation has been entered into.</p>

<h3>Limitation of Liability</h3>
<p>In no event shall our firm, its attorneys, employees, or agents be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenue, whether incurred directly or indirectly.</p>

<h3>Contact Us</h3>
<p>If you have questions about this disclaimer or our legal services, please contact us directly.</p>`,
};
