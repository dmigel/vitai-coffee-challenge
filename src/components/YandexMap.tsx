"use client";

import Image from "next/image";
import { useState } from "react";

import logo from "@/assets/logo.png";
import { workshopAddress, workshopCoords } from "@/data/contacts";

const MAP_HEIGHT_PX = 480;

/**
 * Механизм загрузки iframe: только по клику на «Показать карту».
 * IntersectionObserver не используем — во встроенных браузерах Instagram/Яндекса
 * лишний сетевой запрос к виджету карт лучше не начинать, пока человек явно
 * не попросил карту. Кнопка на заглушке остаётся осмысленной и доступной.
 *
 * Метка дома: параметр pt виджета (координаты + стиль pm2orm).
 * Так placemark привязан к геоточке и не «ездит» при панорамировании,
 * в отличие от CSS-оверлея по центру кадра.
 */
const mapWidgetSrc = `https://yandex.ru/map-widget/v1/?ll=${workshopCoords.lon}%2C${workshopCoords.lat}&z=16&pt=${workshopCoords.lon},${workshopCoords.lat},pm2orm&l=map`;

const openInMapsHref = `https://yandex.ru/maps/?ll=${workshopCoords.lon}%2C${workshopCoords.lat}&z=16&pt=${workshopCoords.lon},${workshopCoords.lat}`;

export function YandexMap() {
  const [showMap, setShowMap] = useState(false);

  return (
    <div className="contacts-map">
      <div
        className="contacts-map-frame"
        style={{ height: MAP_HEIGHT_PX }}
      >
        {showMap ? (
          <iframe
            title="Мастерская «Кварта» на Яндекс.Картах"
            src={mapWidgetSrc}
            className="contacts-map-iframe"
            loading="lazy"
            allowFullScreen
          />
        ) : (
          <div className="contacts-map-stub">
            <div className="contacts-map-stub-pin" aria-hidden>
              <Image
                src={logo}
                alt=""
                width={48}
                height={48}
                className="contacts-map-stub-logo"
                sizes="48px"
              />
            </div>
            <p className="contacts-map-stub-address">{workshopAddress}</p>
            <button
              type="button"
              className="contacts-map-show-btn"
              onClick={() => setShowMap(true)}
            >
              Показать карту
            </button>
          </div>
        )}
      </div>

      <p className="contacts-map-open">
        <a
          href={openInMapsHref}
          target="_blank"
          rel="noopener noreferrer"
          className="contacts-map-open-link"
        >
          Открыть в Яндекс.Картах
        </a>
      </p>
    </div>
  );
}
