import { Apple, Play, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  const handleDonateClick = () => {
    navigate("/donate");
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
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center space-y-6 px-4 text-center text-white">
        <img
          src="/lovable-uploads/79c6f326-4fb6-4bde-b022-b535daac0279.png"
          alt="Silhouette"
          className="w-32 h-auto mb-2 drop-shadow-2xl"
        />
        <img
          src="/lovable-uploads/28360bbd-5963-4c42-9bd1-693b4c9cff3f.png"
          alt="RE:GOD Logo"
          className="w-80 h-auto mb-4 drop-shadow-2xl"
        />
        <h2 className="text-3xl font-light text-yellow-100 md:text-4xl drop-shadow-lg">
          Coming Soon
        </h2>
        <p className="max-w-3xl text-lg text-orange-100 md:text-xl drop-shadow-lg">
          A Bible study on a cell phone with in-app connection to a teacher for
          questions and prayer. Created in such a way that those who don’t know
          God may come in contact with Him through the inspired Word, music,
          images, and personal testimonies.
          <br />
          <br />
          Thank you for contributing to the start up of this unique app. Praying
          it will be available soon so you can share it within your sphere of
          influence!
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-4 pt-6">
          <div className="bg-black/80 backdrop-blur-sm border border-gray-600 rounded-xl px-6 py-3 flex items-center space-x-3 hover:bg-black/90 transition-colors cursor-pointer min-w-[200px]">
            <Apple className="h-8 w-8 text-white" />
            <div className="text-left">
              <div className="text-xs text-gray-300">Download on the</div>
              <div className="text-lg font-semibold text-white">App Store</div>
            </div>
          </div>

          <div className="bg-black/80 backdrop-blur-sm border border-gray-600 rounded-xl px-6 py-3 flex items-center space-x-3 hover:bg-black/90 transition-colors cursor-pointer min-w-[200px]">
            <Play className="h-8 w-8 text-white" />
            <div className="text-left">
              <div className="text-xs text-gray-300">GET IT ON</div>
              <div className="text-lg font-semibold text-white">
                Google Play
              </div>
            </div>
          </div>
        </div>

        <div className="pt-4">
          <button
            onClick={handleDonateClick}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 text-white font-semibold px-8 py-3 rounded-xl flex items-center space-x-3 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
          >
            <Heart className="h-6 w-6" />
            <span className="text-lg">Support This Project</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Index;
