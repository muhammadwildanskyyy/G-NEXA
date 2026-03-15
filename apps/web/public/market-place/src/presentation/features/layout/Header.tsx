import ItemNav from "../header/ItemNav";
import MainNav from "../header/MainNav";
import TopBar from "../header/TopBar";

export default function Header() {
    return (
        <header className="bg-zinc-900 sticky top-0 z-50 bg-background-dark border-b border-dark">
            <TopBar />
            <MainNav />
            <ItemNav />
        </header>
    );
}
