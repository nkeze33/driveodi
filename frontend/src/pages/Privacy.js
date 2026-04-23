import React from "react";

function Privacy() {
  return (
    <div className="page">
      <div className="card" style={{ maxWidth: "900px", margin: "40px auto" }}>
        <h1 className="title">Privacy Policy</h1>
        <p className="subtitle">
          This Privacy Policy explains how Driveodi handles your information.
        </p>

        <h2>1. Information We Collect</h2>
        <p>
          We may collect information you provide directly, including your name,
          email address, location details, account credentials, subscription
          status, and information you enter into the app such as student and
          lesson records.
        </p>

        <h2>2. How We Use Your Information</h2>
        <p>
          Your information is used to provide the service, manage your account,
          process subscriptions, improve the platform, and maintain security.
        </p>

        <h2>3. Payment Information</h2>
        <p>
          Payment processing is handled by Stripe. We do not store full payment
          card details on our servers.
        </p>

        <h2>4. Data Storage</h2>
        <p>
          Account and platform data may be stored in databases and systems used
          to operate the application. Reasonable technical and organizational
          steps are taken to protect that information.
        </p>

        <h2>5. Data Sharing</h2>
        <p>
          We do not sell your personal information. Information may be shared
          only where necessary to operate the service, comply with legal
          obligations, or work with trusted service providers such as payment and
          hosting platforms.
        </p>

        <h2>6. Security</h2>
        <p>
          We take reasonable steps to protect user data, including authentication
          controls and subscription-based access restrictions. However, no system
          can guarantee absolute security.
        </p>

        <h2>7. Data Retention</h2>
        <p>
          We retain information for as long as necessary to provide the service,
          comply with legal obligations, resolve disputes, and enforce our terms.
        </p>

        <h2>8. Your Rights</h2>
        <p>
          Depending on your location, you may have rights to request access,
          correction, or deletion of your personal information.
        </p>

        <h2>9. Updates to This Policy</h2>
        <p>
          This Privacy Policy may be updated from time to time. Continued use of
          the service after updates means you accept the revised policy.
        </p>

        <h2>10. Contact</h2>
        <p>
          For privacy-related questions, please contact BCO DataSoft Solutions.
        </p>
      </div>
    </div>
  );
}

export default Privacy;