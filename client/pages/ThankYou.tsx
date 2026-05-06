import { Link } from "react-router-dom";
import Layout from "@site/components/layout/Layout";
import Seo from "@site/components/Seo";
import { Button } from "@site/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function ThankYou() {
  return (
    <Layout>
      <Seo
        title="Thank You | Cherney Law Firm"
        description="Thank you for contacting us. We will be in touch shortly."
        noindex={true}
      />

      <div className="min-h-[60vh] flex items-center justify-center py-20">
        <div className="text-center max-w-2xl mx-auto px-4">
          <div className="flex justify-center mb-6">
            <CheckCircle className="w-20 h-20 text-law-accent" strokeWidth={1.5} />
          </div>
          <h1 className="font-playfair text-[40px] md:text-[54px] text-white mb-4 leading-tight">
            Thank You!
          </h1>
          <p className="font-outfit text-[18px] md:text-[20px] text-white/80 mb-4">
            Your message has been received.
          </p>
          <p className="font-outfit text-[16px] md:text-[18px] text-white/60 mb-10">
            A member of our team will contact you as soon as possible.
            If you need immediate assistance, please call us directly.
          </p>
          <Link to="/">
            <Button className="bg-law-accent text-black font-outfit text-[18px] md:text-[20px] px-10 py-6 h-auto hover:bg-law-accent/90 transition-colors">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    </Layout>
  );
}
