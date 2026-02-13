import Link from "next/link";
import { CubeIcon, BoltIcon } from "@heroicons/react/24/outline";
import { LandingStatsCard } from "./components/LandingStatsCard";

export default function Home() {
  return (
    <div className="animate-fade-in">
      {/* Hero-блок на всю ширину с самого верха */}
      <div className="relative w-full overflow-hidden min-h-[30vh] sm:min-h-[40vh] lg:min-h-[60vh]">
        {/* Фоновое изображение */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: "url('https://i.pinimg.com/originals/79/26/47/7926476d9d6f5fa8c2cb9b9ee771e0c0.jpg')",
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-b from-white/30 via-white/40 to-white/50" />
        </div>

        {/* Контент hero-блока */}
        <div className="relative mx-auto flex min-h-[30vh] sm:min-h-[50vh] lg:min-h-[60vh] max-w-7xl flex-col items-center justify-center px-4 pt-8 pb-0 sm:py-3 lg:py-5 -mb-2">
          {/* Бейдж - Geist Sans */}
          <div className="animate-slide-down-fast mb-1 sm:mb-3 inline-flex items-center gap-1 rounded-full bg-white/90 px-2 py-0.5 sm:px-3 sm:py-1 text-[7px] sm:text-xs font-medium text-pink-700 shadow-lg backdrop-blur-md">
            <span className="relative flex h-1.5 w-1.5 sm:h-2 sm:w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-pink-400 opacity-75"></span>
              <span className="relative inline-flex h-1.5 w-1.5 sm:h-2 sm:w-2 rounded-full bg-pink-500"></span>
            </span>
            Новый формат подарков — реальное время, без повторов
          </div>
          
          {/* Заголовок - ТОЛЬКО ЭТА СТРОКА Soledago */}
          <div className="flex justify-center items-center w-full px-2">
          <h1 className="animate-slide-up-slow mb-0.5 sm:mb-3 text-balance text-2xl sm:text-lg md:text-4xl lg:text-3xl xl:text-4xl 2xl:text-5xl font-bold leading-tight tracking-tight text-gray-900 drop-shadow-lg font-soledago text-center">
              Социальный вишлист{" "}
              <span className="bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent font-soledago">
                — дари то, что хотят
              </span>
            </h1>
          </div>
          
          {/* Подзаголовок - Geist Sans */}
          <p className="animate-slide-up-medium max-w-3xl text-[11px] sm:text-xs lg:text-base text-gray-700 drop-shadow-md px-2 mb-1 sm:mb-4">
            Создавай списки желаний, делись с друзьями и собирай подарки без
            неловких повторов. <span className="font-semibold text-pink-600">Покупайте подарки друзьям вместе</span> и обновления в{" "}
            <span className="font-semibold text-pink-600">реальном времени</span>.
          </p>

          {/* Кнопка - Geist Sans */}
          <div className="animate-slide-up-medium-delay flex justify-center w-full px-4">
          <Link
  href="/register"
  className="rounded-full border-2 border-white/80 bg-white/80 px-3 py-0.5 text-[9px] sm:text-sm font-semibold text-gray-800 shadow-lg backdrop-blur-sm transition-all duration-300 hover:bg-white hover:scale-105 hover:border-pink-300 sm:px-8 sm:py-2.5 sm:text-base w-auto"
>
  Создать вишлист — бесплатно
</Link>
              
          </div>
        </div>
      </div>

      {/* БЛОК С КАРТОЧКАМИ - ВСЕ Geist Sans */}
      <div className="bg-white/50 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="mb-6 text-center">
            {/* Заголовок секции - Geist Sans */}
            <h2 className="text-xl font-bold text-gray-900 sm:text-2xl">
              Почему выбирают{" "}
              <span className="bg-gradient-to-r from-pink-600 to-pink-500 bg-clip-text text-transparent">
                Wishlist
              </span>
            </h2>
            <p className="mt-1 text-xs text-gray-600">Всё, что нужно для идеальных подарков</p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {/* Без сюрпризов - Geist Sans */}
            <div className="group animate-card-1 rounded-2xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200">
                <CubeIcon className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Без сюрпризов</h3>
              <p className="text-xs leading-relaxed text-gray-600">
                Друзья бронируют подарки, но не видят, кто именно что выбрал.
                Ты просто получаешь то, что реально хочешь.
              </p>
            </div>

            {/* Покупайте подарки друзьям вместе — данные из БД, реалтайм */}
            <LandingStatsCard />

            {/* Реалтайм - Geist Sans */}
            <div className="group animate-card-3 rounded-2xl bg-white p-4 shadow-md transition-all duration-300 hover:shadow-xl hover:scale-[1.01]">
              <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-pink-100 to-pink-200">
                <BoltIcon className="h-5 w-5 text-pink-600" />
              </div>
              <h3 className="mb-1 text-sm font-semibold text-gray-900">Реалтайм</h3>
              <p className="text-xs leading-relaxed text-gray-600">
                Все обновления — бронирования и вклады — появляются мгновенно без
                перезагрузки страницы.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}