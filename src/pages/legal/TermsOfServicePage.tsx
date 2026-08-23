import { Link } from 'react-router-dom';
import { LegalDocument, type LegalClause } from '@/components/legal/LegalDocument';
import { P, Lead, H3, List, Item, Term, Callout, Table } from '@/components/legal/prose';
import {
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

function Internal({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <Link to={to} className="font-medium text-brand-600 underline-offset-4 hover:underline dark:text-brand-400">
      {children}
    </Link>
  );
}

const clauses: LegalClause[] = [
  {
    id: 'agreement',
    title: 'Agreement to these Terms',
    body: (
      <>
        <Lead>
          These Terms of Service (the <Term>Terms</Term>) form a binding agreement between you and{' '}
          {LEGAL_ENTITY} (“{LEGAL_SHORT}”, “we”, “us” or “our”), and govern your access to and use of
          the {LEGAL_SHORT} platform.
        </Lead>
        <P>
          By creating an account, booking or delivering a session, or otherwise using the Platform,
          you confirm that you have read and accept these Terms and our{' '}
          <Internal to="/privacy">Privacy Policy</Internal>. If you do not accept them, you must not
          use the Platform.
        </P>
        <P>
          If you accept these Terms on behalf of an institute, company or other organisation, you
          represent that you are authorised to bind that organisation, and “you” refers to that
          organisation.
        </P>
        <Callout tone="warning" title="Provisions that limit our liability">
          Clause 5 explains the limits of what verification proves. Clauses 19 to 21 disclaim certain
          warranties, cap our liability and require you to indemnify us. Clause 22 governs how
          disputes are resolved. Please read these clauses carefully — they materially affect your
          legal rights.
        </Callout>
      </>
    ),
  },
  {
    id: 'definitions',
    title: 'Definitions',
    body: (
      <>
        <List>
          <Item>
            <Term>Platform</Term> — the {LEGAL_SHORT} website, dashboards, and related services.
          </Item>
          <Item>
            <Term>Tutor</Term> — an independent individual who offers tuition services through the
            Platform.
          </Item>
          <Item>
            <Term>Client</Term> — a student, parent, guardian or institute who books or seeks to book
            a Tutor.
          </Item>
          <Item>
            <Term>Session</Term> — a tuition appointment booked through the Platform, whether
            delivered online or in person.
          </Item>
          <Item>
            <Term>Session Fee</Term> — the amount payable by a Client for a Session, as displayed at
            the time of booking.
          </Item>
          <Item>
            <Term>Service Fee</Term> — the commission {LEGAL_SHORT} deducts from the Session Fee, as
            set out in clause 10.
          </Item>
          <Item>
            <Term>Escrow</Term> — the holding of a Session Fee by our payment provider after the
            Client pays and before funds are released to the Tutor.
          </Item>
          <Item>
            <Term>Verified Badge</Term> — the marker shown on a Tutor profile once all seven
            verification steps have been completed and approved.
          </Item>
          <Item>
            <Term>Content</Term> — any text, image, document, review, rating or other material
            submitted to the Platform.
          </Item>
        </List>
      </>
    ),
  },
  {
    id: 'eligibility',
    title: 'Eligibility and your account',
    body: (
      <>
        <P>
          You must be at least {MINIMUM_ACCOUNT_AGE} years old and legally capable of entering into a
          binding contract to hold an account. Where tuition is for a learner under{' '}
          {MINIMUM_ACCOUNT_AGE}, a parent or legal guardian must hold the account, make the booking,
          and accept these Terms on the learner’s behalf.
        </P>
        <P>
          You agree to provide accurate, current and complete information when registering, and to
          keep it up to date. You may hold only one account per role unless we agree otherwise in
          writing, and you may not transfer your account to another person.
        </P>
        <P>
          You are responsible for maintaining the confidentiality of your credentials and for all
          activity under your account. Notify us immediately at{' '}
          <Mail address={LEGAL_CONTACTS.support} /> if you suspect unauthorised access.
        </P>
        <P>
          We may refuse registration, or suspend or close an account, where we reasonably believe the
          information given is false, the account is being used in breach of these Terms, or the
          account holder has previously been removed from the Platform.
        </P>
      </>
    ),
  },
  {
    id: 'our-role',
    title: 'Our role: a marketplace, not a party to the tuition',
    body: (
      <>
        <Lead>
          {LEGAL_SHORT} provides a venue where Clients and Tutors find one another, agree terms, and
          transact. We are not a school, a tuition provider, or an employer of Tutors.
        </Lead>
        <P>
          The contract for tuition is formed directly between the Client and the Tutor. {LEGAL_SHORT}{' '}
          is not a party to it. We do not set the curriculum, direct how a Tutor teaches, supervise
          Sessions, or guarantee any particular academic result.
        </P>
        <List>
          <Item>
            Tutors are independent contractors. Nothing in these Terms creates an employment, agency,
            partnership or joint-venture relationship between {LEGAL_SHORT} and any Tutor.
          </Item>
          <Item>
            Tutors are solely responsible for their own taxes, registrations, licences and
            statutory contributions arising from their tuition income.
          </Item>
          <Item>
            Tutors decide their own rates, availability and teaching methods, subject to these Terms.
          </Item>
        </List>
        <P>
          We do, however, take an active role in trust and safety: we verify Tutors, hold funds in
          escrow, moderate Content, investigate reports, and remove users who breach these Terms.
        </P>
      </>
    ),
  },
  {
    id: 'verification-limits',
    title: 'What verification does and does not mean',
    body: (
      <>
        <P>
          Every Tutor bearing a Verified Badge has completed our six-step process: identity
          verification, educational credential checks, a criminal background check, confirmation of
          teaching experience, a recorded introduction video, and a final human review.
        </P>
        <Callout tone="warning" title="Verification reduces risk. It does not eliminate it.">
          Verification confirms that specified checks were completed and passed at a point in time,
          against the records then available. It is not a guarantee of a Tutor’s future conduct,
          continued suitability, teaching quality, or academic outcome, and it is not a warranty by{' '}
          {LEGAL_SHORT} as to any Tutor.
        </Callout>
        <P>
          Background checks are limited to the records accessible to our verification partners in
          Pakistan and may not reveal every relevant matter. A check reflects the position at the
          date it was carried out. Clients remain responsible for exercising ordinary care — meeting
          a Tutor, supervising Sessions involving children, and reporting concerns promptly.
        </P>
        <P>
          Report any safety concern immediately to <Mail address={LEGAL_CONTACTS.safety} /> or
          through <Internal to="/report">Report Misconduct</Internal>. Where there is an immediate
          risk to a child, contact the police first.
        </P>
      </>
    ),
  },
  {
    id: 'bookings',
    title: 'Booking Sessions',
    body: (
      <>
        <P>
          A booking request becomes a confirmed Session when the Tutor accepts it and payment has
          been authorised and placed into Escrow. Until both have occurred, no Session is confirmed
          and no obligation to teach or to pay arises.
        </P>
        <P>
          Session details — subject, date, time, duration, mode and address where applicable — are
          those shown on the confirmation. Any change must be agreed through the Platform so that the
          record, and the payment attached to it, stays accurate.
        </P>
        <P>
          Both parties must attend at the confirmed time. A Session is treated as delivered when the
          Tutor has attended and taught for the booked duration, or where the Client has failed to
          attend without cancelling within the notice period in clause 7.
        </P>
      </>
    ),
  },
  {
    id: 'cancellations',
    title: 'Cancellations, rescheduling and no-shows',
    body: (
      <>
        <P>
          Plans change, and the Platform is built to accommodate that — provided the other party is
          given fair notice.
        </P>
        <Table
          head={['Situation', 'Outcome']}
          rows={[
            [
              'Client cancels more than 24 hours before the Session',
              'Full refund of the Session Fee to the original payment method',
            ],
            [
              'Client cancels within 24 hours of the Session',
              'Up to 50% of the Session Fee may be released to the Tutor for the reserved time',
            ],
            [
              'Client does not attend and does not cancel',
              'The Session Fee may be released to the Tutor in full',
            ],
            [
              'Tutor cancels, at any notice',
              'Full refund to the Client, and the cancellation is recorded against the Tutor',
            ],
            [
              'Tutor does not attend',
              'Full refund to the Client; repeated non-attendance may result in removal',
            ],
            [
              'Either party is prevented by an emergency or force majeure',
              'Reviewed case by case; we may refund in full or reschedule without penalty',
            ],
          ]}
        />
        <P>
          Rescheduling by mutual agreement more than 24 hours before a Session carries no penalty and
          keeps the Session Fee in Escrow against the new time. We monitor cancellation patterns, and
          persistent late cancellation by either party may lead to suspension.
        </P>
      </>
    ),
  },
  {
    id: 'fees-payments',
    title: 'Session Fees, payment and escrow',
    body: (
      <>
        <P>
          Session Fees are set by Tutors and displayed inclusive of any applicable taxes before you
          confirm a booking. All amounts are in Pakistani Rupees (PKR) unless stated otherwise.
        </P>
        <P>
          Payment is taken at the time of booking through our licensed payment provider, which
          supports credit and debit cards, JazzCash and Easypaisa. {LEGAL_SHORT} does not receive or
          store your full card details.
        </P>
        <H3>How escrow works</H3>
        <List ordered>
          <Item>The Client pays the Session Fee at the time of booking.</Item>
          <Item>The funds are held in Escrow. The Tutor can see that payment is secured, but cannot draw it.</Item>
          <Item>The Session takes place.</Item>
          <Item>
            Funds are released to the Tutor’s balance after the Session is marked complete and the
            dispute window in clause 9 has passed without a dispute being raised.
          </Item>
          <Item>Where a valid dispute or cancellation applies, funds are refunded instead.</Item>
        </List>
        <P>
          You must not pay a Tutor outside the Platform for a Session arranged through it. Off-platform
          payment removes escrow protection, leaves you without recourse to our dispute process, and
          breaches clause 13.
        </P>
      </>
    ),
  },
  {
    id: 'refunds',
    title: 'Refunds and disputes',
    body: (
      <>
        <P>
          If a Session was not delivered, ended materially early, or differed materially from what was
          booked, raise a dispute through your dashboard within <Term>72 hours</Term> of the scheduled
          end time. Funds in Escrow are held until the dispute is resolved.
        </P>
        <P>
          We will review the booking record, in-platform messages and any evidence submitted by both
          parties, and may ask for further information. We aim to decide within seven working days
          and will notify both parties of the outcome and the reason for it.
        </P>
        <P>
          Approved refunds are returned to the original payment method. The time taken for funds to
          appear depends on your bank or wallet provider and is outside our control.
        </P>
        <P>
          Our decision on the release or refund of escrowed funds is final as between us and you in
          respect of that payment. It does not prevent either party from pursuing the other directly
          in respect of the underlying tuition contract, to which we are not a party.
        </P>
      </>
    ),
  },
  {
    id: 'tutor-payouts',
    title: 'Service Fee and Tutor payouts',
    body: (
      <>
        <P>
          {LEGAL_SHORT} deducts a Service Fee from each Session Fee. The Service Fee decreases as a
          Tutor completes more Sessions on the Platform.
        </P>
        <Table
          head={['Stage', 'Sessions completed', 'Service Fee', 'Tutor receives']}
          rows={[
            ['New Tutor', '0 – 50', '20%', '80%'],
            ['Growing Tutor', '51 – 200', '17%', '83%'],
            ['Experienced Tutor', '201 – 500', '14%', '86%'],
            ['Top / Master Tutor', 'Over 500', '10%', '90%'],
          ]}
        />
        <P>
          The rates above are the schedule current at the effective date of these Terms. The{' '}
          <Internal to="/pricing">Pricing page</Internal> always shows the current schedule. We may
          change the Service Fee on not less than 30 days’ notice; the change will not affect Sessions
          already booked.
        </P>
        <P>
          Tutors are responsible for all taxes on their earnings. Where law requires us to withhold or
          deduct tax at source, we will do so and provide the relevant documentation. Payouts are made
          to the bank account or mobile wallet registered by the Tutor; we are not liable for delay or
          loss caused by incorrect payout details supplied by the Tutor.
        </P>
      </>
    ),
  },
  {
    id: 'tutor-obligations',
    title: 'Tutor obligations',
    body: (
      <>
        <P>As a Tutor, you agree that you will:</P>
        <List>
          <Item>
            provide accurate profile information, and submit only genuine, unaltered documents for
            verification;
          </Item>
          <Item>
            hold and maintain every qualification, licence and right to work that you claim, and tell
            us promptly if any lapses or is withdrawn;
          </Item>
          <Item>
            tell us promptly if you are charged with or convicted of any offence relevant to working
            with children;
          </Item>
          <Item>attend confirmed Sessions punctually and teach the booked subject and duration;</Item>
          <Item>
            behave professionally and appropriately at all times, and never be alone with a child in
            circumstances a reasonable parent would object to;
          </Item>
          <Item>
            keep student information confidential and use it only to deliver tuition;
          </Item>
          <Item>
            not delegate a Session to another person, or allow another person to use your account;
          </Item>
          <Item>
            not solicit Clients off the Platform, in breach of clause 13.
          </Item>
        </List>
        <P>
          Failure to meet these obligations may result in loss of the Verified Badge, withholding of
          escrowed funds pending investigation, suspension, or permanent removal — and, where a child
          may be at risk, referral to the authorities.
        </P>
      </>
    ),
  },
  {
    id: 'client-obligations',
    title: 'Client obligations',
    body: (
      <>
        <P>As a Client, you agree that you will:</P>
        <List>
          <Item>provide accurate information about the learner and their requirements;</Item>
          <Item>
            supervise Sessions involving a child, including online Sessions, and provide a safe and
            appropriate environment for in-person Sessions;
          </Item>
          <Item>attend booked Sessions punctually, or cancel within the notice period in clause 7;</Item>
          <Item>treat Tutors with respect and not discriminate against them unlawfully;</Item>
          <Item>
            pay Session Fees through the Platform, and not seek to arrange or pay for Sessions outside
            it;
          </Item>
          <Item>leave reviews that are honest, first-hand and free of abuse.</Item>
        </List>
      </>
    ),
  },
  {
    id: 'circumvention',
    title: 'Off-platform circumvention',
    body: (
      <>
        <P>
          Our verification, escrow, dispute resolution and safety tools only protect Sessions arranged
          and paid for through the Platform. Taking a relationship formed here off-platform strips
          away those protections for both sides.
        </P>
        <P>
          Accordingly, for as long as your account is open and for <Term>12 months</Term> after your
          last Session with a given counterparty, you must not solicit or accept an arrangement to
          deliver or receive tuition with that counterparty outside the Platform, nor exchange contact
          details for that purpose before a booking is confirmed.
        </P>
        <P>
          Where we reasonably determine that this clause has been breached, we may suspend or close
          the accounts involved and withhold Service Fees properly due. This clause does not restrict
          a pre-existing relationship that began independently of the Platform.
        </P>
      </>
    ),
  },
  {
    id: 'prohibited',
    title: 'Prohibited conduct',
    body: (
      <>
        <P>You must not, and must not permit anyone else to:</P>
        <List>
          <Item>
            use the Platform for any unlawful purpose, or in breach of the Prevention of Electronic
            Crimes Act 2016 or any other applicable law;
          </Item>
          <Item>
            harass, threaten, abuse, defame or discriminate against any person, or post content that
            is obscene, hateful or harmful to children;
          </Item>
          <Item>
            impersonate any person, misrepresent your identity or qualifications, or submit forged
            documents;
          </Item>
          <Item>post false, misleading or incentivised reviews, or manipulate ratings;</Item>
          <Item>
            attempt to gain unauthorised access to any account, system or data, or probe, scan or test
            the vulnerability of our infrastructure;
          </Item>
          <Item>
            scrape, crawl, or use automated means to extract data from the Platform, or use Platform
            data to build a competing service;
          </Item>
          <Item>
            introduce malware, or interfere with the proper working of the Platform or the experience
            of other users;
          </Item>
          <Item>use the Platform to advertise or promote unrelated goods and services.</Item>
        </List>
      </>
    ),
  },
  {
    id: 'content',
    title: 'Your Content, reviews and moderation',
    body: (
      <>
        <P>
          You retain ownership of the Content you submit. You grant {LEGAL_SHORT} a non-exclusive,
          worldwide, royalty-free licence to host, store, reproduce, display and distribute that
          Content for the purpose of operating, promoting and improving the Platform. The licence over
          a given item of Content ends when you delete it, save for copies retained in backups or
          required for a legal or safety purpose.
        </P>
        <P>
          You are responsible for your Content and confirm that you own it or have the right to submit
          it, and that it does not infringe any third party’s rights or breach any law.
        </P>
        <H3>Reviews</H3>
        <P>
          Reviews must be based on a Session actually booked and delivered through the Platform. We do
          not remove a review merely because it is unfavourable. We do remove reviews that are
          abusive, contain personal information, are demonstrably false, are posted in exchange for an
          incentive, or breach these Terms.
        </P>
        <P>
          We may review, moderate, refuse or remove Content at our discretion, and are not obliged to
          monitor Content proactively. Removal decisions may be appealed by writing to{' '}
          <Mail address={LEGAL_CONTACTS.support} />.
        </P>
      </>
    ),
  },
  {
    id: 'intellectual-property',
    title: 'Our intellectual property',
    body: (
      <>
        <P>
          The Platform, including its software, design, text, graphics, logos and the {LEGAL_SHORT}{' '}
          name and marks, is owned by {LEGAL_ENTITY} or its licensors and is protected by intellectual
          property law.
        </P>
        <P>
          We grant you a limited, non-exclusive, non-transferable, revocable licence to access and use
          the Platform for its intended purpose, in accordance with these Terms. You may not copy,
          modify, distribute, sell, lease, reverse-engineer or create derivative works from any part
          of the Platform, or use our marks without our prior written consent.
        </P>
      </>
    ),
  },
  {
    id: 'privacy-link',
    title: 'Privacy and data protection',
    body: (
      <>
        <P>
          Our collection and use of personal information is governed by our{' '}
          <Internal to="/privacy">Privacy Policy</Internal>, which forms part of these Terms.
        </P>
        <P>
          Where you receive another user’s personal information through the Platform — a Tutor
          receiving a learner’s address, for example — you must use it only to deliver or receive the
          Session, keep it secure, refrain from disclosing it to anyone else, and delete it when it is
          no longer needed.
        </P>
      </>
    ),
  },
  {
    id: 'suspension',
    title: 'Suspension and termination',
    body: (
      <>
        <P>
          You may close your account at any time from your dashboard settings. Closure does not
          extinguish obligations already accrued — Sessions already delivered must still be paid for,
          and escrowed funds are dealt with under clauses 8 and 9.
        </P>
        <P>
          We may suspend or terminate your access, with immediate effect and without prior notice
          where the circumstances require it, if we reasonably believe that you have breached these
          Terms, that your continued access presents a risk to another user — particularly a child —
          or to the Platform, or that suspension is required by law.
        </P>
        <P>
          Where we suspend an account pending investigation, we will tell you the general nature of
          the concern unless doing so would prejudice an investigation or a safeguarding matter, and
          we will give you a fair opportunity to respond. Funds properly due to you will be released
          once the investigation concludes, less any amount properly withheld.
        </P>
        <P>
          Clauses which by their nature should survive termination — including clauses 13, 15 to 17
          and 19 to 24 — continue in force.
        </P>
      </>
    ),
  },
  {
    id: 'disclaimers',
    title: 'Disclaimers',
    body: (
      <>
        <P>
          The Platform is provided on an “as is” and “as available” basis. To the fullest extent
          permitted by law, we exclude all warranties, conditions and representations not expressly
          set out in these Terms, whether express or implied.
        </P>
        <P>We do not warrant that:</P>
        <List>
          <Item>the Platform will be uninterrupted, timely, secure or error-free;</Item>
          <Item>
            any Tutor will meet your expectations, or that tuition will produce any particular
            academic result;
          </Item>
          <Item>
            information provided by users, including profiles and reviews, is accurate or complete.
          </Item>
        </List>
        <P>
          Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or
          limited, including liability for death or personal injury caused by negligence, or for
          fraud or fraudulent misrepresentation.
        </P>
      </>
    ),
  },
  {
    id: 'liability',
    title: 'Limitation of liability',
    body: (
      <>
        <P>
          Subject to clause 19, and to the fullest extent permitted by law, {LEGAL_SHORT} shall not be
          liable for any indirect, incidental, special, consequential or punitive loss, or for any
          loss of profit, revenue, data, goodwill or anticipated saving, however arising.
        </P>
        <P>
          Our total aggregate liability arising out of or in connection with these Terms and your use
          of the Platform, whether in contract, tort (including negligence), breach of statutory duty
          or otherwise, shall not exceed the greater of:
        </P>
        <List>
          <Item>
            the total Service Fees we received in respect of your account in the six months
            immediately preceding the event giving rise to the claim; or
          </Item>
          <Item>PKR 25,000.</Item>
        </List>
        <P>
          Because the tuition contract is between the Client and the Tutor, we are not liable for the
          acts, omissions or conduct of any user, including the quality, safety or legality of tuition
          delivered, or for any loss arising from arrangements made outside the Platform.
        </P>
      </>
    ),
  },
  {
    id: 'indemnity',
    title: 'Indemnity',
    body: (
      <>
        <P>
          You agree to indemnify and hold harmless {LEGAL_ENTITY}, its officers, employees and agents
          against any claim, demand, loss, liability, cost or expense (including reasonable legal
          fees) arising out of or in connection with your breach of these Terms, your Content, your
          use of the Platform, or your violation of any law or of the rights of a third party.
        </P>
        <P>
          We will notify you of any such claim, and you may not settle it in a way that imposes an
          obligation or admission on us without our prior written consent.
        </P>
      </>
    ),
  },
  {
    id: 'disputes',
    title: 'Governing law and dispute resolution',
    body: (
      <>
        <P>
          These Terms, and any dispute arising out of or in connection with them or their subject
          matter, are governed by {GOVERNING_LAW}, without regard to conflict-of-law principles.
        </P>
        <H3>Escalation before proceedings</H3>
        <P>
          If a dispute arises between you and {LEGAL_SHORT}, you agree to first raise it in writing to{' '}
          <Mail address={LEGAL_CONTACTS.legal} />, setting out the nature of the dispute and the
          outcome sought. Both parties will attempt in good faith to resolve it within 30 days of that
          notice. This step is a precondition to commencing proceedings, except where urgent
          injunctive relief is required.
        </P>
        <H3>Forum</H3>
        <P>
          If the dispute is not resolved, it shall be subject to the exclusive jurisdiction of{' '}
          {GOVERNING_FORUM}. Nothing in this clause prevents either party from applying to any court
          of competent jurisdiction for interim or protective relief.
        </P>
        <P>
          Disputes between a Client and a Tutor about a Session are handled under clause 9. That
          process concerns the release of escrowed funds and does not limit either party’s rights
          against the other under the tuition contract.
        </P>
      </>
    ),
  },
  {
    id: 'changes',
    title: 'Changes to these Terms',
    body: (
      <>
        <P>
          We may amend these Terms to reflect changes to the Platform, our business or the law. The
          version and effective date at the top of this page always identify the current text.
        </P>
        <P>
          For material changes we will give at least 30 days’ notice by email or through a prominent
          notice on the Platform before they take effect, except where a shorter period is required by
          law or necessary to address a security or safety risk. Continuing to use the Platform after
          a change takes effect constitutes acceptance. If you do not accept a change, you may close
          your account before it takes effect.
        </P>
        <P>
          Sessions already booked remain governed by the Terms in force when they were booked.
        </P>
      </>
    ),
  },
  {
    id: 'general',
    title: 'General provisions',
    body: (
      <>
        <List>
          <Item>
            <Term>Entire agreement.</Term> These Terms, together with the Privacy Policy and any
            document expressly incorporated by reference, constitute the entire agreement between you
            and us regarding the Platform.
          </Item>
          <Item>
            <Term>Severability.</Term> If any provision is held invalid or unenforceable, it shall be
            modified to the minimum extent necessary, and the remaining provisions remain in full
            force.
          </Item>
          <Item>
            <Term>No waiver.</Term> A failure to enforce any provision is not a waiver of the right to
            enforce it later.
          </Item>
          <Item>
            <Term>Assignment.</Term> You may not assign or transfer your rights under these Terms
            without our prior written consent. We may assign them to an affiliate or in connection
            with a merger, acquisition or sale of assets.
          </Item>
          <Item>
            <Term>Force majeure.</Term> Neither party is liable for failure to perform caused by an
            event beyond its reasonable control, including natural disaster, epidemic, war, civil
            unrest, strike, failure of telecommunications or utilities, or act of government.
          </Item>
          <Item>
            <Term>Notices.</Term> We may give notice by email to the address registered to your
            account or by posting on the Platform. Notices to us must be sent to{' '}
            <Mail address={LEGAL_CONTACTS.legal} />.
          </Item>
          <Item>
            <Term>Language.</Term> These Terms are made in English. Any translation is provided for
            convenience only, and the English text prevails.
          </Item>
          <Item>
            <Term>Third parties.</Term> No person other than you and {LEGAL_SHORT} has any right to
            enforce these Terms.
          </Item>
        </List>
      </>
    ),
  },
  {
    id: 'contact',
    title: 'How to contact us',
    body: (
      <>
        <P>Questions about these Terms should be addressed to:</P>
        <List>
          <Item>
            <Term>Legal:</Term> <Mail address={LEGAL_CONTACTS.legal} />
          </Item>
          <Item>
            <Term>Support:</Term> <Mail address={LEGAL_CONTACTS.support} />
          </Item>
          <Item>
            <Term>Trust and safety:</Term> <Mail address={LEGAL_CONTACTS.safety} />
          </Item>
          <Item>
            <Term>Post:</Term> {LEGAL_ENTITY}, {REGISTERED_OFFICE_ONELINE}
          </Item>
          <Item>
            <Term>Telephone:</Term>{' '}
            <a href={LEGAL_CONTACTS.phoneHref} className="font-medium text-brand-600 underline-offset-4 hover:underline dark:text-brand-400">
              {LEGAL_CONTACTS.phone}
            </a>
          </Item>
        </List>
      </>
    ),
  },
];

export default function TermsOfServicePage() {
  return (
    <LegalDocument
      eyebrow="Legal"
      title="Terms of Service"
      summary={
        <>
          These Terms govern your use of {LEGAL_SHORT} — how bookings are made, how payments are held
          in escrow and released, what our verification does and does not promise, and the
          responsibilities each of us takes on. They form a binding agreement, so please read them.
        </>
      }
      clauses={clauses}
      companion={{
        to: '/privacy',
        label: 'Privacy Policy',
        description: 'What personal information we collect, why, and the rights you have over it.',
      }}
    />
  );
}
