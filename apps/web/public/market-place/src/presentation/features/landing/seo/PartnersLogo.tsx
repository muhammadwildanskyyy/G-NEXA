const PartnerLogos = () => {
    return (
        <div className="border-t border-border-dark pt-12">
            <div className="grid md:grid-cols-2 gap-12 text-left text-sm text-slate-400">
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-white font-bold mb-4">Pembayaran</p>
                        <div className="space-y-2">
                            <p>Visa</p>
                            <p>Mastercard</p>
                            <p>BCA</p>
                            <p>Mandiri</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-white font-bold mb-4">Pengiriman</p>
                        <div className="space-y-2">
                            <p>JNE</p>
                            <p>J&T</p>
                            <p>Ninja</p>
                            <p>SiCepat</p>
                        </div>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <p className="text-white font-bold mb-4">Partner</p>
                        <div className="space-y-2">
                            <p>GoJek</p>
                            <p>BNI</p>
                            <p>BCA</p>
                        </div>
                    </div>

                    <div>
                        <p className="text-white font-bold mb-4">Security</p>
                        <div className="space-y-2">
                            <p>PCI Security</p>
                            <p>Encrypted Network</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PartnerLogos;
