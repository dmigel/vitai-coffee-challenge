import { YandexMap } from "@/components/YandexMap";
import { contacts, workshopAddress } from "@/data/contacts";

export function Contacts() {
  return (
    <section
      id="contacts"
      className="scroll-mt-6 bg-background px-5 py-20 sm:px-8 sm:py-24 lg:px-16"
    >
      <div className="mx-auto w-full max-w-[1280px]">
        <h2 className="font-display max-w-3xl text-3xl leading-tight tracking-tight sm:text-4xl lg:text-5xl">
          Где мы находимся и как забрать?
        </h2>

        <div className="contacts-layout mt-10 sm:mt-12">
          <div className="contacts-info">
            <div className="contacts-block">
              <h3 className="font-display text-lg leading-snug tracking-tight sm:text-xl">
                Самовывоз
              </h3>
              <ul className="contacts-list mt-5 m-0 list-none p-0">
                <li className="contacts-list-item">
                  <span className="contacts-list-value">
                    {workshopAddress} (приходите познакомиться и забрать свой
                    кофе лично).
                  </span>
                </li>
                <li className="contacts-list-item">
                  <span className="contacts-list-value">
                    Время работы: будни с 8:00 до 20:00, выходные с 10:00 до
                    18:00.
                  </span>
                </li>
              </ul>
            </div>

            <div className="contacts-block">
              <h3 className="font-display text-lg leading-snug tracking-tight sm:text-xl">
                Доставка
              </h3>
              <ul className="contacts-list mt-5 m-0 list-none p-0">
                <li className="contacts-list-item">
                  <span className="contacts-list-value">
                    Развозим заказы каждую пятницу прямо к вашей двери.
                  </span>
                </li>
                <li className="contacts-list-item">
                  <span className="contacts-list-value">
                    При заказе от 50 BYN — доставка бесплатная. (Если меньше — 7
                    BYN).
                  </span>
                </li>
              </ul>
            </div>

            <div className="contacts-block">
              <h3 className="font-display text-lg leading-snug tracking-tight sm:text-xl">
                Связаться с нами быстро
              </h3>
              <ul className="contacts-list mt-5 m-0 list-none p-0">
                <li className="contacts-list-item">
                  <span className="contacts-list-label">Телефон</span>
                  <span className="contacts-list-value">{contacts.phone}</span>
                </li>
                <li className="contacts-list-item">
                  <span className="contacts-list-label">Telegram</span>
                  <span className="contacts-list-value">{contacts.telegram}</span>
                </li>
                <li className="contacts-list-item">
                  <span className="contacts-list-label">Instagram</span>
                  <span className="contacts-list-value">{contacts.instagram}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="contacts-map-col">
            <YandexMap />
          </div>
        </div>
      </div>
    </section>
  );
}
