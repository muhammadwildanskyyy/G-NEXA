const ColorFilter = () => {
    return (
        <div>
            <h3 className="text-white text-xs font-black uppercase tracking-widest border-b border-border-dark pb-3 mb-4">
                Warna
            </h3>

            <div className="flex flex-wrap gap-2">
                <button className="w-6 h-6 bg-black border border-white/20" />

                <button className="w-6 h-6 bg-white border border-white/20" />

                <button className="w-6 h-6 bg-primary border border-white/20" />

                <button className="w-6 h-6 bg-zinc-700 border border-white/20" />
            </div>
        </div>
    );
};
export default ColorFilter;
