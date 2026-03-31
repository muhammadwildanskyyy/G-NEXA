interface FooterColumnProps {
    title: string;
    links: string[];
}

const FooterColumn = ({ title, links }: FooterColumnProps) => {
    return (
        <div>
            <h4 className="text-white text-sm font-black uppercase tracking-[0.3em] mb-8 border-l-4 border-primary pl-4">
                {title}
            </h4>

            <ul className="space-y-4">
                {links.map((link) => (
                    <li key={link}>
                        <a
                            href="#"
                            className="text-slate-400 hover:text-primary transition-colors text-sm uppercase font-bold tracking-widest"
                        >
                            {link}
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
};

export default FooterColumn;
