import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function AwardsSection() {
  return (
    <div className="relative">
      {/* Split background: top 30% black, bottom 70% white */}
      <div className="absolute inset-0">
        <div className="h-[30%] bg-[#161715]"></div>
        <div className="h-[70%] bg-white"></div>
      </div>

      {/* Centered gray box overlapping both backgrounds */}
      <div className="relative z-10 max-w-[2560px] mx-auto w-[95%] md:w-[90%] py-[40px] md:py-[60px]">
        <div className="bg-[#f0f0f0] py-[50px] md:py-[70px] px-[30px] md:px-[60px] lg:px-[100px] text-center">
          <p className="font-outfit text-[16px] md:text-[18px] text-law-accent mb-[15px]">
            — Weekend &amp; Evening Appointments
          </p>

          <h2 className="font-playfair text-[32px] md:text-[42px] lg:text-[48px] leading-[1.2] text-black mb-[20px]">
            What Are Your Options?
          </h2>

          <p className="font-outfit text-[15px] md:text-[17px] leading-[1.7] text-black max-w-[700px] mx-auto mb-[30px]">
            Contact attorney Matthew Cherney and see what your options are when it comes to filing for bankruptcy, or avoiding it all together.
          </p>

          <Link to="/contact">
            <Button className="bg-law-accent text-black font-outfit text-[18px] md:text-[20px] py-[22px] px-[35px] h-auto hover:bg-law-accent-dark hover:text-white transition-all duration-300">
              Contact Us
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
