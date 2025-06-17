
import { Apple, Play } from "lucide-react";

const Index = () => {
  return (
    <div
      className="relative min-h-screen w-full bg-cover bg-center"
      style={{
        backgroundImage: "url('/lovable-uploads/1174d5e1-9ba9-4d08-9b4a-255cb5f8cd4a.png')",
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center space-y-6 px-4 text-center text-white">
        <img 
          src="/lovable-uploads/28360bbd-5963-4c42-9bd1-693b4c9cff3f.png" 
          alt="RE:GOD Logo" 
          className="w-80 h-auto mb-4 drop-shadow-2xl"
        />
        <h2 className="text-3xl font-light text-yellow-100 md:text-4xl drop-shadow-lg">
          Coming Soon
        </h2>
        <p className="max-w-3xl text-lg text-orange-100 md:text-xl drop-shadow-lg">
          Regarding God an audio-visual exploration of the character of God based on his interactions with people recorded in the Bible and shared in more recent times
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
              <div className="text-lg font-semibold text-white">Google Play</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
