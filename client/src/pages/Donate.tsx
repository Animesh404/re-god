import { ArrowLeft, ExternalLink, QrCode, CreditCard } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Donate = () => {
  const navigate = useNavigate();

  const handlePayPalClick = () => {
    // Replace with actual PayPal donation link
    window.open("https://www.paypal.com/paypalme/RegardingGod", "_blank");
  };

  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center"
      style={{
        backgroundImage:
          "url('/lovable-uploads/1174d5e1-9ba9-4d08-9b4a-255cb5f8cd4a.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 min-h-screen px-4 py-8">
        {/* Back button */}
        <button
          onClick={() => navigate("/")}
          className="mb-8 flex items-center space-x-2 text-white hover:text-yellow-300 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
          <span>Back to Home</span>
        </button>

        <div className="flex flex-col items-center justify-center space-y-8 text-center text-white">
          <img
            src="/lovable-uploads/79c6f326-4fb6-4bde-b022-b535daac0279.png"
            alt="Silhouette"
            className="w-24 h-auto mb-2 drop-shadow-2xl"
          />

          <h1 className="text-4xl font-bold text-yellow-100 md:text-5xl drop-shadow-lg">
            Support RE:GOD
          </h1>

          <p className="max-w-2xl text-lg text-orange-100 md:text-xl drop-shadow-lg">
            Your support helps us continue developing this audio-visual
            exploration of God's character
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mt-12 max-w-4xl w-full">
            {/* PayPal Option */}
            <div className="bg-black/80 backdrop-blur-sm border border-gray-600 rounded-xl p-8 hover:bg-black/90 transition-all duration-300 transform hover:scale-105">
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-blue-600 p-4 rounded-full">
                  <ExternalLink className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white">
                  PayPal Donation
                </h3>
                <p className="text-gray-300 text-center">
                  Quick and secure donation through PayPal
                </p>
                <button
                  onClick={handlePayPalClick}
                  className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-8 py-3 rounded-xl flex items-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl"
                >
                  <ExternalLink className="h-5 w-5" />
                  <span>Donate via PayPal</span>
                </button>
              </div>
            </div>

            {/* Bank Transfer Option */}
            <div className="bg-black/80 backdrop-blur-sm border border-gray-600 rounded-xl p-8 hover:bg-black/90 transition-all duration-300 transform hover:scale-105">
              <div className="flex flex-col items-center space-y-6">
                <div className="bg-green-600 p-4 rounded-full">
                  <QrCode className="h-8 w-8 text-white" />
                </div>
                <h3 className="text-2xl font-semibold text-white">
                  Bank Transfer
                </h3>
                <p className="text-gray-300 text-center">
                  Direct bank transfer or Zelle payment
                </p>

                {/* QR Code Placeholder */}
                <div className="bg-white p-4 rounded-lg">
                  <div className="w-40 h-49 bg-gray-200 rounded flex items-center justify-center">
                    <img
                      src="/lovable-uploads/toni-zelle.jpg"
                      alt="QR Code"
                      className="w-full h-full object-contain"
                    />
                  </div>
                </div>

                {/* Zelle Information */}
                {/* <div className="bg-gray-800 p-4 rounded-lg w-full">
                  <h4 className="text-lg font-semibold text-white mb-2 flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Zelle</span>
                  </h4>
                  <p className="text-gray-300 text-sm">
                    Email:{" "}
                    <span className="text-yellow-300">donation@regod.com</span>
                  </p>
                  <p className="text-gray-300 text-sm mt-1">
                    Name:{" "}
                    <span className="text-yellow-300">RE:GOD Project</span>
                  </p>
                </div> */}
              </div>
            </div>
          </div>

          <div className="mt-8 text-center">
            <p className="text-gray-300 text-sm">
              Thank you for supporting our mission to explore God's character
              through digital media
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Donate;
