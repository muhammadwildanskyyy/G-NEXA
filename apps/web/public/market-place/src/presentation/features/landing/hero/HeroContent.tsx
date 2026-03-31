const HeroContent = () => {
  return (
      <div className="relative lg:w-1/2 bg-surface-dark flex items-center">
          {/* Decorative background text */}
          <div className="absolute -right-20 top-20 text-[200px] font-black text-white/[0.02] select-none leading-none">
              GEAR
          </div>

          <div className="relative z-10 p-8 lg:p-20">
              <p className="text-primary text-sm font-black tracking-[0.5em] uppercase mb-6">
                  G-Nexa Accessories
              </p>

              <h1 className="text-white text-6xl lg:text-9xl font-black leading-[0.85] tracking-tighter mb-10 italic">
                  NEXT-LEVEL <br /> GEAR
              </h1>

              <p className="text-slate-400 text-lg max-w-md mb-12 leading-relaxed font-light">
                  Engineered for the elite. Experience precision, speed, and
                  uncompromising style with our latest peripheral lineup.
              </p>

              <div className="flex flex-wrap gap-6">
                  <button className="bg-primary hover:bg-white hover:text-primary text-white px-12 py-5 text-sm font-black uppercase tracking-widest transition-all">
                      Shop Collection
                  </button>

                  <button className="border border-border-dark hover:border-primary text-white px-12 py-5 text-sm font-black uppercase tracking-widest transition-all">
                      Learn More
                  </button>
              </div>
          </div>
      </div>
  );
}
export default HeroContent