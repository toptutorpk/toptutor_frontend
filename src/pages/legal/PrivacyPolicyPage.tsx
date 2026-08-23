import { Link } from 'react-router-dom';
import { LegalDocument, type LegalClause } from '@/components/legal/LegalDocument';
import { P, Lead, H3, List, Item, Term, Callout, Table } from '@/components/legal/prose';
import {
  DATA_REQUEST_WINDOW_DAYS,
  GOVERNING_FORUM,
  GOVERNING_LAW,
  LEGAL_CONTACTS,
  LEGAL_ENTITY,
  LEGAL_SHORT,
  MINIMUM_ACCOUNT_AGE,
  REGISTERED_OFFICE_ONELINE,
} from '@/constants/legal';

function Mail({ address }: { address: string }) {
  return (
    <a href={`mailto:${address}`} className="font-medium text-brand-600 underline-offset-4 hover:underline dark:text-brand-400">
      {address}
    </a>
  );
}

const clauses: LegalClause[] = [
  {
    id: 'introduction',
    title: 'Introduction and scope',
    body: (
      <>
        <Lead>
          {LEGAL_ENTITY} (“{LEGAL_SHORT}”, “we”, “us” or “our”) operates the {LEGAL_SHORT} platform,
          an online marketplace that connects students, parents and institutes in Pakistan with
          independently verified tutors. This Privacy Policy explains what personal information we
          collect, why we collect it, who we share it with, how long we keep it, and the rights
          available to you.
        </Lead>
        <P>
          This Policy applies to the {LEGAL_SHORT} website, its dashboards for students, parents,
          tutors and institutes, and every related service that links to this Policy (together, the
          <Term> Platform</Term>). It applies whether you hold an account or simply browse.
        </P>
        <P>
          This Policy forms part of, and should be read together with, our{' '}
          <Link to="/terms" className="font-medium text-brand-600 underline-offset-4 hover:underline dark:text-brand-400">
            Terms of Service
          </Link>
          . Capitalised terms not defined here carry the meaning given to them in those Terms.
        </P>
        <P>
          If you do not agree with this Policy, please do not use the Platform. Continuing to use the
          Platform after a change to this Policy takes effect signifies your acceptance of the
          amended Policy.
        </P>
      </>
    ),
  },
  {
    id: 'controller',
    title: 'Who is responsible for your information',
    body: (
      <>
        <P>
          {LEGAL_ENTITY} is the entity that determines the purposes and means of processing personal
          information collected through the Platform, and is accountable for that processing.
        </P>
        <List>
          <Item>
            <Term>Registered office:</Term> {REGISTERED_OFFICE_ONELINE}
          </Item>
          <Item>
            <Term>Privacy contact:</Term> <Mail address={LEGAL_CONTACTS.privacy} />
          </Item>
          <Item>
            <Term>General support:</Term> <Mail address={LEGAL_CONTACTS.support} />
          </Item>
        </List>
        <P>
          Tutors, students, parents and institutes act independently of one another. Where a tutor or
          an institute uses information obtained through the Platform for their own purposes — for
          example, a tutor keeping their own records of a student’s progress — that party is
          separately responsible for their handling of that information under applicable law.
        </P>
      </>
    ),
  },
  {
    id: 'summary',
    title: 'Summary of key points',
    body: (
      <>
        <P>
          This summary is provided for convenience only. It is not a substitute for the full Policy,
          and the detailed clauses below prevail in the event of any inconsistency.
        </P>
        <List>
          <Item>
            We collect the information you give us when you register, build a profile, book or teach
            sessions, message another user, or contact support.
          </Item>
          <Item>
            Tutors undergo a six-step verification that involves identity documents, educational
            credentials and a criminal-record check. This is sensitive information and is handled
            under the additional safeguards described in clause 7.
          </Item>
          <Item>
            We do not sell your personal information, and we do not share it with advertisers for
            their own marketing purposes.
          </Item>
          <Item>
            We never receive or store your full card number. Payments are processed by a licensed
            payment provider and held in escrow until a session is completed.
          </Item>
          <Item>
            Accounts for learners under {MINIMUM_ACCOUNT_AGE} must be held and managed by a parent or
            legal guardian. See clause 8.
          </Item>
          <Item>
            You may access, correct, export or delete your information, and withdraw consent, as
            described in clause 17.
          </Item>
        </List>
      </>
    ),
  },
  {
    id: 'information-you-provide',
    title: 'Information you provide to us',
    body: (
      <>
        <P>We collect the following categories of information directly from you.</P>

        <H3>Account and contact information</H3>
        <P>
          Your name, email address, mobile number, password (stored only in hashed form), city,
          account role, and the verification codes sent to confirm your email address or phone
          number. If you register using a third-party sign-in service such as Google, we receive your
          name, email address and profile image from that service.
        </P>

        <H3>Student and parent profile information</H3>
        <P>
          Grade level, subjects of interest, learning preferences, session location preferences, and
          — where a parent registers on behalf of a child — the child’s first name, grade and
          learning requirements. Please provide only what is necessary for a tutor to teach
          effectively.
        </P>

        <H3>Tutor profile and verification information</H3>
        <P>
          Professional biography, qualifications, subjects and grade levels taught, hourly rates,
          availability, teaching experience, references, bank or mobile-wallet details for payouts,
          and the documents required for verification, including your CNIC, degree and experience
          certificates, a photograph or short video for identity matching, and the outcome of a
          criminal-record check.
        </P>

        <H3>Institute information</H3>
        <P>
          Institute name, registration details, address, the name and contact details of the
          authorised representative, and hiring requirements.
        </P>

        <H3>Content you create</H3>
        <P>
          Messages exchanged with other users through the Platform, reviews and ratings, dispute
          submissions, support tickets, contact-form enquiries, and any documents or images you
          upload.
        </P>

        <Callout title="Please do not send us information we have not asked for">
          Do not upload medical records, financial statements, or documents belonging to third
          parties unless we specifically request them. If you send us sensitive information that is
          not required for a stated purpose, we will delete it.
        </Callout>
      </>
    ),
  },
  {
    id: 'information-we-generate',
    title: 'Information generated through your use of the Platform',
    body: (
      <>
        <P>
          Using the Platform necessarily creates records. We collect and retain the following
          transactional and technical information.
        </P>
        <List>
          <Item>
            <Term>Booking and session records</Term> — the tutor and student involved, subject, date,
            time, duration, mode (online or in person), status, cancellations, reschedules and
            no-shows.
          </Item>
          <Item>
            <Term>Payment records</Term> — amounts, currency, platform commission, escrow status,
            payout status, refunds and chargebacks. See clause 10.
          </Item>
          <Item>
            <Term>Communications metadata</Term> — the time a message was sent, the parties involved,
            read and delivery status, and online-presence indicators.
          </Item>
          <Item>
            <Term>Device and log information</Term> — IP address, browser type and version, operating
            system, device identifiers, referring pages, pages viewed, search queries run on the
            Platform, and the date and time of each request.
          </Item>
          <Item>
            <Term>Trust and safety signals</Term> — reports of misconduct, moderation decisions,
            failed login attempts, and indicators used to detect fraud or automated abuse.
          </Item>
        </List>
      </>
    ),
  },
  {
    id: 'third-party-sources',
    title: 'Information we receive from third parties',
    body: (
      <>
        <P>We receive personal information about you from the following sources.</P>
        <List>
          <Item>
            <Term>Identity and background verification providers</Term> — confirmation that a CNIC is
            valid and matches the person presenting it, and the result of a criminal-record check.
          </Item>
          <Item>
            <Term>Educational institutions and previous employers</Term> — confirmation of degrees,
            certificates and employment history submitted by a tutor.
          </Item>
          <Item>
            <Term>Payment providers</Term> — transaction status, the last four digits and brand of a
            card, wallet identifiers, settlement confirmations and chargeback notices.
          </Item>
          <Item>
            <Term>Authentication providers</Term> — basic profile information where you choose to
            sign in through a third-party service.
          </Item>
          <Item>
            <Term>Other users</Term> — a parent supplying a child’s details, an institute supplying
            an employee’s details, or a user reporting misconduct.
          </Item>
        </List>
        <P>
          Where you provide us with another person’s information, you confirm that you are entitled
          to do so and that you have informed them how their information will be used under this
          Policy.
        </P>
      </>
    ),
  },
  {
    id: 'sensitive-information',
    title: 'Sensitive personal information',
    body: (
      <>
        <P>
          Certain information we process attracts heightened protection because its misuse carries a
          greater risk to you. This includes national identity numbers and CNIC images, facial images
          used for identity matching, and criminal-record information.
        </P>
        <P>
          We process this information only for identity verification, child-safety screening, fraud
          prevention, and compliance with law. We do not use it for marketing, profiling or any
          purpose unrelated to establishing that a tutor is who they claim to be and is safe to place
          in contact with children.
        </P>
        <List>
          <Item>Access is restricted to trained personnel whose role requires it.</Item>
          <Item>Access is logged and subject to internal review.</Item>
          <Item>
            Verification documents are stored separately from public profile information and are
            never displayed on a tutor’s public profile.
          </Item>
          <Item>
            Students, parents and institutes see only the outcome of verification — the verified
            badge and which steps were completed — never the underlying documents.
          </Item>
        </List>
      </>
    ),
  },
  {
    id: 'children',
    title: 'Children’s information and parental consent',
    body: (
      <>
        <Lead>
          The Platform is designed to arrange tuition for learners of school age, but it is not
          designed to be operated by them.
        </Lead>
        <P>
          An account may only be registered and controlled by a person aged {MINIMUM_ACCOUNT_AGE} or
          over. Where the learner is under {MINIMUM_ACCOUNT_AGE}, a parent or legal guardian must
          hold the account, make bookings, and supervise the arrangement. By adding a child’s details
          to your account, you confirm that you are that child’s parent or legal guardian and consent
          to our processing of their information as described in this Policy.
        </P>
        <P>
          We ask for the minimum information about a child that a tutor needs in order to teach:
          typically a first name, grade level and subject requirements. We do not require a child’s
          identity documents, and we ask that you do not provide them.
        </P>
        <Callout tone="warning" title="Supervision of sessions">
          Parents and guardians remain responsible for supervising sessions, including online
          sessions and any session conducted at a home address. We provide verification, in-platform
          messaging and reporting tools, but we are not present at sessions and do not monitor their
          content in real time.
        </Callout>
        <P>
          If you believe a child has provided us with personal information without the involvement of
          a parent or guardian, contact <Mail address={LEGAL_CONTACTS.privacy} /> and we will delete
          it. Child-safety concerns should be raised immediately at{' '}
          <Mail address={LEGAL_CONTACTS.safety} />.
        </P>
      </>
    ),
  },
  {
    id: 'verification',
    title: 'How tutor verification information is handled',
    body: (
      <>
        <P>
          Tutors complete a six-step verification before a verified badge is issued: identity
          verification, educational credential checks, a criminal background check, confirmation of
          teaching experience, a recorded introduction video, and a final human review by our team.
        </P>
        <P>
          Verification documents are collected for that purpose alone. We disclose to students,
          parents and institutes only which steps a tutor has completed and when — never the
          documents themselves, a CNIC number, or the detail of a background-check result.
        </P>
        <H3>Human review of verification outcomes</H3>
        <P>
          Automated checks may assist verification, for example by comparing a submitted photograph
          against an identity document. No tutor is refused a verified badge, suspended or removed on
          the basis of an automated decision alone: a member of our team reviews the file before any
          adverse outcome is finalised.
        </P>
        <P>
          A tutor who is refused verification may request the reason, submit corrected documents, and
          ask for the decision to be reconsidered by writing to{' '}
          <Mail address={LEGAL_CONTACTS.support} />.
        </P>
      </>
    ),
  },
  {
    id: 'payments',
    title: 'Payment and financial information',
    body: (
      <>
        <P>
          Payments are processed by licensed third-party payment providers supporting card, JazzCash
          and Easypaisa transactions. Card details are captured by the payment provider on its own
          systems. {LEGAL_SHORT} does not receive, process or store your full card number, expiry
          date or security code.
        </P>
        <P>
          We receive and retain a transaction reference, the amount and currency, the payment method
          type, the last four digits and brand of a card where applicable, and the status of the
          payment. We use this to operate escrow, release funds to tutors, issue refunds, resolve
          disputes and meet accounting and tax obligations.
        </P>
        <P>
          Tutors provide bank account or mobile-wallet details for payouts. These are used to remit
          earnings and to meet withholding and reporting obligations, and are retained for the period
          required by tax and accounting law.
        </P>
      </>
    ),
  },
  {
    id: 'how-we-use',
    title: 'How and why we use your information',
    body: (
      <>
        <P>
          We use personal information only for the purposes set out below, and only where we have a
          lawful basis to do so.
        </P>
        <Table
          head={['Purpose', 'Information used', 'Basis']}
          rows={[
            [
              'Creating and administering your account',
              'Account, contact and profile information',
              'Performance of our contract with you',
            ],
            [
              'Matching students with tutors and displaying profiles',
              'Profile, subject, location, rating and availability information',
              'Performance of our contract with you',
            ],
            [
              'Verifying tutors and protecting children',
              'Identity documents, credentials, background-check results',
              'Consent, and our legitimate interest in child safety',
            ],
            [
              'Processing payments, escrow and payouts',
              'Booking and payment records, payout details',
              'Performance of our contract; legal obligation',
            ],
            [
              'Enabling messaging, reviews and dispute resolution',
              'Communications, reviews, dispute submissions',
              'Performance of our contract with you',
            ],
            [
              'Preventing fraud, abuse and unauthorised access',
              'Device and log information, trust and safety signals',
              'Legitimate interest in a secure platform',
            ],
            [
              'Providing support and responding to enquiries',
              'Contact details, support tickets, related records',
              'Performance of our contract; legitimate interest',
            ],
            [
              'Improving and measuring the Platform',
              'Aggregated and de-identified usage information',
              'Legitimate interest in improving our service',
            ],
            [
              'Sending service messages you cannot opt out of',
              'Contact details, booking records',
              'Performance of our contract with you',
            ],
            [
              'Sending optional marketing communications',
              'Contact details, broad usage preferences',
              'Consent, withdrawable at any time',
            ],
            [
              'Meeting legal, tax and regulatory obligations',
              'Transaction records, identity records, correspondence',
              'Legal obligation',
            ],
          ]}
        />
        <P>
          Where we rely on consent, you may withdraw it at any time as described in clause 17.
          Withdrawing consent does not affect processing carried out before the withdrawal, and may
          mean we can no longer provide part of the service — a tutor who withdraws consent to
          verification, for example, cannot retain a verified badge.
        </P>
      </>
    ),
  },
  {
    id: 'sharing',
    title: 'When and with whom we share information',
    body: (
      <>
        <Lead>
          We do not sell personal information, and we do not disclose it to third parties for their
          own marketing purposes.
        </Lead>
        <P>We share personal information only in the circumstances described below.</P>

        <H3>With other users, to make a booking work</H3>
        <List>
          <Item>
            Tutors see the first name of the student or parent, the subject and grade level, session
            details, and messages sent to them. Contact details and the session address are released
            only once a booking is confirmed, and only to the tutor engaged for that booking.
          </Item>
          <Item>
            Students, parents and institutes see a tutor’s public profile: name, photograph,
            biography, qualifications as verified, subjects, rates, availability, reviews and
            verification status.
          </Item>
          <Item>
            Reviews you publish are visible to other users together with your display name and are
            associated with your account.
          </Item>
        </List>

        <H3>With service providers acting on our instructions</H3>
        <P>
          We use vetted providers for cloud hosting and storage, payment processing, identity and
          background verification, email and SMS delivery, video sessions, error monitoring and
          analytics. Each is permitted to process personal information only to provide services to
          us, under a written contract imposing confidentiality and security obligations, and is
          prohibited from using it for their own purposes.
        </P>

        <H3>For legal, safety and regulatory reasons</H3>
        <P>
          We may disclose information where we believe in good faith that disclosure is required by
          law or by a lawful order of a court or competent authority; is necessary to investigate
          suspected fraud, misconduct or a breach of our Terms; or is necessary to protect the
          safety, rights or property of any person — in particular the safety of a child. Where we
          are permitted to notify you of such a request, we will.
        </P>

        <H3>In a corporate transaction</H3>
        <P>
          If {LEGAL_SHORT} is involved in a merger, acquisition, financing or sale of assets, personal
          information may be transferred as part of that transaction. We will require the recipient
          to honour this Policy, and we will notify you before your information becomes subject to a
          materially different privacy policy.
        </P>
      </>
    ),
  },
  {
    id: 'cookies',
    title: 'Cookies and similar technologies',
    body: (
      <>
        <P>
          We use cookies and similar browser storage to keep you signed in, remember preferences such
          as theme and city, secure forms against cross-site request forgery, and understand how the
          Platform is used so we can improve it.
        </P>
        <Table
          head={['Category', 'What it does', 'Can you refuse it?']}
          rows={[
            [
              'Strictly necessary',
              'Authentication, session integrity, security and load balancing',
              'No — the Platform cannot function without these',
            ],
            [
              'Preference',
              'Remembers theme, city and display choices',
              'Yes, though settings will reset each visit',
            ],
            [
              'Analytics',
              'Aggregated measurement of feature usage and performance',
              'Yes',
            ],
          ]}
        />
        <P>
          Most browsers let you block or delete cookies through their settings. Blocking strictly
          necessary cookies will prevent you from signing in. We do not use cookies to build
          advertising profiles or to track you across unrelated websites.
        </P>
      </>
    ),
  },
  {
    id: 'transfers',
    title: 'International transfers',
    body: (
      <>
        <P>
          We are based in Pakistan and prefer to keep personal information within Pakistan. Some of
          our service providers — notably cloud hosting, email delivery and error monitoring —
          operate infrastructure outside Pakistan, so your information may be transferred to and
          processed in other countries whose data protection laws differ from those of Pakistan.
        </P>
        <P>
          Where we transfer personal information abroad, we require the recipient to protect it to a
          standard consistent with this Policy through contractual commitments, and we limit the
          information transferred to what the provider needs.
        </P>
      </>
    ),
  },
  {
    id: 'retention',
    title: 'How long we keep your information',
    body: (
      <>
        <P>
          We keep personal information only for as long as it is needed for the purpose it was
          collected for, and then for any additional period required by law or necessary to resolve
          disputes and enforce our agreements.
        </P>
        <Table
          head={['Record', 'Retention period']}
          rows={[
            ['Active account and profile information', 'For as long as the account remains open'],
            [
              'Closed account records',
              'Deleted or irreversibly anonymised within 90 days of closure, subject to the exceptions below',
            ],
            [
              'Booking, payment and invoice records',
              'Retained for the period required by tax and accounting law, currently a minimum of six years',
            ],
            [
              'Tutor verification documents',
              'For the duration of the verified status, and up to 12 months after the account closes',
            ],
            [
              'In-platform messages',
              'For the life of the account, or longer where preserved for an investigation or dispute',
            ],
            [
              'Trust and safety and misconduct records',
              'Up to seven years, so that a removed user cannot simply re-register',
            ],
            ['Server and security logs', 'Typically 12 months'],
          ]}
        />
        <P>
          Where information must be retained for one purpose after it is no longer needed for
          another, we restrict access to it so that it is used only for the purpose requiring its
          retention.
        </P>
      </>
    ),
  },
  {
    id: 'security',
    title: 'How we protect your information',
    body: (
      <>
        <P>
          We maintain administrative, technical and physical safeguards designed to protect personal
          information against loss, misuse and unauthorised access, disclosure, alteration or
          destruction. These include encryption of traffic in transit, encryption of verification
          documents at rest, hashed password storage, role-based access controls, access logging,
          and periodic review of our security practices.
        </P>
        <P>
          No method of transmission or storage is completely secure, and we cannot guarantee absolute
          security. You are responsible for keeping your password confidential, for using a password
          unique to the Platform, and for notifying us promptly at{' '}
          <Mail address={LEGAL_CONTACTS.support} /> if you believe your account has been compromised.
        </P>
        <P>
          If a breach of personal information occurs that is likely to result in significant risk to
          you, we will notify you and any competent authority as required by applicable law, without
          undue delay.
        </P>
      </>
    ),
  },
  {
    id: 'rights',
    title: 'Your rights and how to exercise them',
    body: (
      <>
        <P>Subject to applicable law, you may ask us to:</P>
        <List>
          <Item>
            <Term>Access</Term> the personal information we hold about you and be told how it is
            used.
          </Item>
          <Item>
            <Term>Correct</Term> information that is inaccurate or incomplete. Most profile
            information can be corrected directly in your dashboard.
          </Item>
          <Item>
            <Term>Delete</Term> your information and close your account, subject to the retention
            obligations in clause 15.
          </Item>
          <Item>
            <Term>Export</Term> a copy of the information you provided to us in a structured,
            commonly used format.
          </Item>
          <Item>
            <Term>Object to or restrict</Term> processing carried out on the basis of our legitimate
            interests, and opt out of marketing at any time.
          </Item>
          <Item>
            <Term>Withdraw consent</Term> where processing is based on consent.
          </Item>
        </List>
        <H3>Making a request</H3>
        <P>
          Write to <Mail address={LEGAL_CONTACTS.privacy} /> from the email address registered to
          your account. We may ask for further information to confirm your identity before acting —
          particularly for deletion or export requests — so that we do not disclose your information
          to someone impersonating you.
        </P>
        <P>
          We will respond within {DATA_REQUEST_WINDOW_DAYS} days. If a request is complex and we need
          longer, we will tell you within that period and explain why. Our response is free of
          charge, unless a request is manifestly unfounded or repetitive, in which case we may charge
          a reasonable fee or decline to act, giving reasons.
        </P>
        <P>
          Some rights are qualified. We may decline a deletion request to the extent the information
          is needed to complete a booking, resolve a dispute, satisfy a tax or accounting obligation,
          or maintain a record of a child-safety concern. Where we decline, we will tell you why.
        </P>
        <P>
          Users located in jurisdictions that confer additional statutory privacy rights may exercise
          those rights by contacting us at the same address, and we will honour them to the extent
          they apply.
        </P>
      </>
    ),
  },
  {
    id: 'communications',
    title: 'Your communication choices',
    body: (
      <>
        <P>
          <Term>Service messages</Term> — booking confirmations, reschedules, payment receipts,
          verification outcomes, security alerts and material changes to our terms — are part of the
          service. They cannot be switched off while your account is open.
        </P>
        <P>
          <Term>Marketing messages</Term> — newsletters, tutor recommendations and promotional offers
          — are optional. You may unsubscribe using the link in any such message, from your account
          settings, or by writing to <Mail address={LEGAL_CONTACTS.support} />. Opting out takes
          effect promptly, though you may receive a message already in transit.
        </P>
      </>
    ),
  },
  {
    id: 'third-party-links',
    title: 'Third-party links and services',
    body: (
      <>
        <P>
          The Platform may link to, or embed, services operated by third parties, including payment
          pages and video-conferencing tools. Those services are governed by their own privacy
          policies, and we are not responsible for their practices. We encourage you to read the
          privacy policy of any third-party service before providing information to it.
        </P>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to this Policy',
    body: (
      <>
        <P>
          We may update this Policy to reflect changes to the Platform, our practices, or legal
          requirements. The version and effective date at the top of this page always identify the
          current text.
        </P>
        <P>
          Where a change materially affects your rights or how we use your information, we will give
          you reasonable advance notice by email or through a prominent notice on the Platform before
          it takes effect. Where the change requires your consent, we will ask for it.
        </P>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'Contacting us and raising a complaint',
    body: (
      <>
        <P>
          Questions, requests and complaints about privacy should be addressed to our privacy contact
          in the first instance.
        </P>
        <List>
          <Item>
            <Term>Email:</Term> <Mail address={LEGAL_CONTACTS.privacy} />
          </Item>
          <Item>
            <Term>Post:</Term> Privacy Contact, {LEGAL_ENTITY}, {REGISTERED_OFFICE_ONELINE}
          </Item>
          <Item>
            <Term>Telephone:</Term>{' '}
            <a href={LEGAL_CONTACTS.phoneHref} className="font-medium text-brand-600 underline-offset-4 hover:underline dark:text-brand-400">
              {LEGAL_CONTACTS.phone}
            </a>
          </Item>
        </List>
        <P>
          We aim to acknowledge a complaint within five working days and to resolve it within{' '}
          {DATA_REQUEST_WINDOW_DAYS} days. If you are not satisfied with our response, you may refer
          the matter to the competent data protection or consumer authority, or to {GOVERNING_FORUM}.
        </P>
        <P>
          This Policy is governed by {GOVERNING_LAW}, including the Prevention of Electronic Crimes
          Act 2016 and any personal data protection legislation as and when it comes into force in
          Pakistan.
        </P>
      </>
    ),
  },
];

export default function PrivacyPolicyPage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Privacy Policy"
      summary={
        <>
          This Policy explains how {LEGAL_ENTITY} collects, uses, shares and protects personal
          information when you use the {LEGAL_SHORT} platform — and the choices and rights you have
          over that information. We have written it to be read, not merely accepted.
        </>
      }
      clauses={clauses}
      companion={{
        to: '/terms',
        label: 'Terms of Service',
        description: 'The agreement governing bookings, payments, escrow and conduct on TopTutor.',
      }}
    />
  );
}
