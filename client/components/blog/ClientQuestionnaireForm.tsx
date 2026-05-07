import { useState, type FormEvent } from "react";

const FORM_NAME = "client-questionnaire";

const US_STATES = [
  "Alabama",
  "Alaska",
  "Arizona",
  "Arkansas",
  "California",
  "Colorado",
  "Connecticut",
  "Delaware",
  "Florida",
  "Georgia",
  "Hawaii",
  "Idaho",
  "Illinois",
  "Indiana",
  "Iowa",
  "Kansas",
  "Kentucky",
  "Louisiana",
  "Maine",
  "Maryland",
  "Massachusetts",
  "Michigan",
  "Minnesota",
  "Mississippi",
  "Missouri",
  "Montana",
  "Nebraska",
  "Nevada",
  "New Hampshire",
  "New Jersey",
  "New Mexico",
  "New York",
  "North Carolina",
  "North Dakota",
  "Ohio",
  "Oklahoma",
  "Oregon",
  "Pennsylvania",
  "Rhode Island",
  "South Carolina",
  "South Dakota",
  "Tennessee",
  "Texas",
  "Utah",
  "Vermont",
  "Virginia",
  "Washington",
  "West Virginia",
  "Wisconsin",
  "Wyoming",
  "District of Columbia",
];

const INCOME_SOURCES = [
  "Social Security",
  "Pension",
  "Retirement",
  "Annuity",
  "Rental Income",
  "Family Contributions",
  "Other",
];

function RequiredAsterisk() {
  return (
    <span className="text-red-600" aria-label="required">
      *
    </span>
  );
}

const YES_NO_QUESTIONS = [
  {
    name: "lived_exclusively_in_georgia_two_years",
    label: "Have you lived exclusively in Georgia for the last two (2) years?",
  },
  { name: "married", label: "Are you married?" },
  {
    name: "filed_bankruptcy_before",
    label: "Have you ever filed for bankruptcy before?",
  },
  {
    name: "own_property",
    label: "Do you own any property anywhere, land, vacant lots or timeshares?",
  },
  { name: "mortgages", label: "Do you have any mortgages?" },
  { name: "vehicle_loans", label: "Do you have any vehicle loans?" },
  {
    name: "financing_or_collateral",
    label:
      "Are you financing anything, or have you pledged anything as collateral for a loan?",
  },
  {
    name: "claims_or_pending_lawsuits_against_anyone",
    label:
      "Do you have any claims against anyone, or any pending lawsuits against anyone?",
  },
  {
    name: "recent_accident_or_injury",
    label: "Have you recently been involved in, or injured in any sort of accident?",
  },
  {
    name: "alimony_or_child_support",
    label: "Do you pay or receive alimony or child support?",
  },
  {
    name: "filed_federal_state_taxes",
    label: "Have you filed all of your federal and state income taxes?",
  },
  { name: "back_taxes", label: "Do you owe money for back taxes?" },
  {
    name: "household_social_security_benefits",
    label: "Do you or anyone in your household receive Social Security benefits?",
  },
  { name: "receive_pension", label: "Do you receive a pension?" },
  {
    name: "bounced_checks_or_nsf_fees",
    label: "Do you owe any money for bounced checks or NSF fee?",
  },
  {
    name: "pending_lawsuit_against_you",
    label: "Do you have any pending lawsuit filed against you?",
  },
  {
    name: "property_up_for_foreclosure",
    label: "Do you own a home or a property that is up for foreclosure?",
  },
  { name: "own_business", label: "Do you own a business?" },
  { name: "bank_or_credit_union", label: "Do you belong to a bank/credit union?" },
  { name: "own_rental_property", label: "Do you own rental property?" },
  {
    name: "transferred_property_last_four_years",
    label:
      "Have you transferred property in or out of your name in the last 4 years (i.e. home, land, vehicle)?",
  },
  {
    name: "credit_card_purchases_past_six_months",
    label: "Have you made any purchases with your credit cards in the past 6 months?",
  },
];

function TextField({
  label,
  name,
  type = "text",
  autoComplete,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="block font-outfit text-[15px] font-medium text-black mb-2">
        {label} <RequiredAsterisk />
      </span>
      <input
        type={type}
        name={name}
        required
        autoComplete={autoComplete}
        className="w-full border border-gray-300 bg-white px-4 py-3 font-outfit text-[16px] text-black outline-none focus:border-law-accent"
      />
    </label>
  );
}

function RadioGroup({
  legend,
  name,
  options,
}: {
  legend: string;
  name: string;
  options: string[];
}) {
  return (
    <fieldset className="border border-gray-200 p-4">
      <legend className="px-1 font-outfit text-[15px] font-medium text-black">
        {legend} <RequiredAsterisk />
      </legend>
      <div className="mt-3 flex flex-wrap gap-x-6 gap-y-3">
        {options.map((option, index) => (
          <label key={option} className="inline-flex items-center gap-2 font-outfit text-[15px] text-black">
            <input
              type="radio"
              name={name}
              value={option}
              required={index === 0}
              className="h-4 w-4 accent-law-accent"
            />
            {option}
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export default function ClientQuestionnaireForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState("");
  const [incomeError, setIncomeError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const formData = new FormData(form);
    const incomeSources = formData.getAll("other_income_sources");

    setError("");
    setIncomeError("");

    if (incomeSources.length === 0) {
      setIncomeError("Please select at least one source of income.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = new URLSearchParams();
      formData.forEach((value, key) => {
        payload.append(key, String(value));
      });

      const response = await fetch("/", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: payload.toString(),
      });

      if (!response.ok) {
        throw new Error("Netlify form submission failed");
      }

      form.reset();
      setIsSuccess(true);
    } catch (err) {
      console.error("Client questionnaire submission error:", err);
      setError("Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form
      name={FORM_NAME}
      method="POST"
      action="/"
      data-netlify="true"
      onSubmit={handleSubmit}
      className="not-prose space-y-6"
    >
      <input type="hidden" name="form-name" value={FORM_NAME} />

      {isSuccess && (
        <div className="border border-green-200 bg-green-50 px-4 py-3 font-outfit text-[16px] text-green-800">
          Thank you. Your questionnaire has been submitted successfully.
        </div>
      )}

      {error && (
        <div className="border border-red-200 bg-red-50 px-4 py-3 font-outfit text-[16px] text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="First Name" name="first_name" autoComplete="given-name" />
        <TextField label="Last Name" name="last_name" autoComplete="family-name" />
      </div>

      <TextField label="Street Address" name="street_address" autoComplete="street-address" />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="City" name="city" autoComplete="address-level2" />
        <label className="block">
          <span className="block font-outfit text-[15px] font-medium text-black mb-2">
            State <RequiredAsterisk />
          </span>
          <select
            name="state"
            required
            autoComplete="address-level1"
            defaultValue=""
            className="w-full border border-gray-300 bg-white px-4 py-3 font-outfit text-[16px] text-black outline-none focus:border-law-accent"
          >
            <option value="" disabled>
              Select a state
            </option>
            {US_STATES.map((state) => (
              <option key={state} value={state}>
                {state}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <TextField label="Zip/Postal Code" name="zip_postal_code" autoComplete="postal-code" />
        <TextField label="Email Address" name="email" type="email" autoComplete="email" />
      </div>

      <TextField label="Phone Number" name="phone" type="tel" autoComplete="tel" />

      <RadioGroup
        legend="Have you lived exclusively in Georgia for the last two (2) years?"
        name="lived_exclusively_in_georgia_two_years"
        options={["Yes", "No"]}
      />

      <RadioGroup
        legend="How many places are you currently employed at?"
        name="current_employment_places"
        options={["0", "1", "2", "3"]}
      />

      <fieldset className="border border-gray-200 p-4">
        <legend className="px-1 font-outfit text-[15px] font-medium text-black">
          Do you have any other sources of income?
        </legend>
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {INCOME_SOURCES.map((source) => (
            <label key={source} className="inline-flex items-center gap-2 font-outfit text-[15px] text-black">
              <input
                type="checkbox"
                name="other_income_sources"
                value={source}
                className="h-4 w-4 accent-law-accent"
              />
              {source}
            </label>
          ))}
        </div>
        {incomeError && (
          <p className="mt-3 font-outfit text-[14px] text-red-700">{incomeError}</p>
        )}
      </fieldset>

      <RadioGroup
        legend="Do you currently own a bank account?"
        name="bank_account_type"
        options={["Checking", "Savings"]}
      />

      {YES_NO_QUESTIONS.slice(1).map((question) => (
        <RadioGroup
          key={question.name}
          legend={question.label}
          name={question.name}
          options={["Yes", "No"]}
        />
      ))}

      <label className="block">
        <span className="block font-outfit text-[15px] font-medium text-black mb-2">
          Please provide a brief explanation as to why you reached out to Cherney Law Firm <RequiredAsterisk />
        </span>
        <textarea
          name="reason_for_contact"
          required
          rows={6}
          className="w-full border border-gray-300 bg-white px-4 py-3 font-outfit text-[16px] text-black outline-none focus:border-law-accent"
        />
      </label>

      <button
        type="submit"
        disabled={isSubmitting}
        className="bg-law-accent px-8 py-4 font-outfit text-[16px] font-semibold text-black transition-colors duration-300 hover:bg-law-accent/80 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {isSubmitting ? "SUBMITTING..." : "SUBMIT"}
      </button>
    </form>
  );
}
