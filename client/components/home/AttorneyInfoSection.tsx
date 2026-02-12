export default function AttorneyInfoSection() {
  return (
    <div className="bg-white py-[40px] md:py-[60px]">
      <div className="max-w-[1100px] mx-auto w-[90%] md:w-[85%]">
        {/* Centered Title */}
        <h2 className="font-playfair text-[32px] md:text-[42px] lg:text-[48px] leading-[1.2] text-black text-center mb-[30px] md:mb-[40px]">
          Top Bankruptcy Attorney Near Marietta, GA
        </h2>

        {/* Two Column Layout: Image (narrower) + Text (wider) */}
        <div className="flex flex-col md:flex-row gap-[25px] md:gap-[35px] mb-[40px] md:mb-[60px]">
          {/* Left Column - City Image */}
          <div className="md:w-[35%] flex-shrink-0">
            <img
              src="https://cdn.builder.io/api/v1/image/assets%2F50bd0f2438824f8ea1271cf7dd2c508e%2Fafbca7c3ff824958916291dbbe9f1be4?format=webp&width=800&height=1200"
              alt="Atlanta, Georgia skyline"
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Right Column - Text Content */}
          <div className="md:w-[65%]">
            <p className="font-outfit text-[15px] md:text-[16px] leading-[1.8] text-black mb-[18px]">
              If you've already decided to pursue bankruptcy, you may have considered attempting to file it on your own or hired a general practice attorney to represent you. However, filing for bankruptcy is an intricate process with many cases involving extensive litigation, and it should be pursued along with the counsel and representation of an experienced bankruptcy lawyer with an outstanding attorney profile.
            </p>

            <p className="font-outfit text-[15px] md:text-[16px] leading-[1.8] text-black mb-[18px]">
              When you need a bankruptcy attorney near Marietta, GA, look no further than Cherney Law Firm. Unlike many firms that practice this area of law, debt resolution is all we do, and that makes all the difference when your property, business, or livelihood is at stake.
            </p>

            <p className="font-outfit text-[15px] md:text-[16px] leading-[1.8] text-black">
              Our attorneys have been helping people and business entities reach financial freedom for over 15 years. With Matthew Cherney and his team on your side, you can finally begin gaining the peace of mind you and your loved ones need to get back on your feet. Our thoughtful counseling and outstanding attention to detail mean we'll leave no stone unturned when working with you, and you can count on us to never lose sight of your best interests.
            </p>
          </div>
        </div>

        {/* Green Box - Stay Informed */}
        <div className="bg-law-accent px-[25px] md:px-[40px] lg:px-[50px] py-[30px] md:py-[40px]">
          <h3 className="font-playfair text-[28px] md:text-[36px] lg:text-[40px] leading-[1.2] text-black text-center mb-[10px]">
            Stay Informed
          </h3>
          <p className="font-outfit text-[15px] md:text-[16px] leading-[1.7] text-black text-center mb-[25px] md:mb-[30px]">
            Understand your rights when it comes to filing for bankruptcy and fighting off creditor harassment.
          </p>

          {/* Radio Network Feature */}
          <div className="flex flex-col sm:flex-row items-center gap-[20px] md:gap-[25px]">
            <div className="flex-shrink-0">
              <img
                src="https://cdn.builder.io/api/v1/image/assets%2F50bd0f2438824f8ea1271cf7dd2c508e%2F97920c9d4cfe43cf8b5962fd8453e7ad?format=webp&width=800&height=1200"
                alt="Business Innovators Radio Network featuring Matthew Cherney"
                className="w-[280px] md:w-[340px] h-auto"
                loading="lazy"
              />
            </div>
            <div>
              <h4 className="font-playfair text-[18px] md:text-[22px] leading-[1.3] text-black font-bold">
                Hear Matthew Cherney – Marietta Bankruptcy Attorney On The Emotional Stress Of Being In Debt
              </h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
