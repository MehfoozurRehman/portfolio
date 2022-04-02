import React, { useEffect, useState } from 'react';
import { Image } from 'cloudinary-react';
import { Link } from 'react-router-dom';
import axios from 'axios';

export default function ProjectCard({ data, filter }) {
  const [languages, setLanguages] = useState([]);
  useEffect(() => {
    axios
      .get(data.languages && data.languages, {
        Authorization: 'Bearer ' + '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',
      })
      .then((res) => {
        setLanguages(res.data);
      });
  }, []);
  let filterMatch;

  data.category.map((item) => {
    filterMatch = item.value === filter;
  });
  return (
    <>
      {filter === '' ? (
        <Link
          to="/project-detail"
          state={{ state: data }}
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }}
          className="project__card"
        >
          <div className="project__card__name">
            {data.name.replace(/-/g, ' ').replace(/_/g, ' ')}
          </div>
          <div className="project__card__description">{data.description}</div>
          <div className="project__card__languages">
            {JSON.stringify(languages)
              .replace(/[0-9]/g, '')
              .replace(/"/g, '')
              .replace(/:/g, '')
              .replace(/,/g, ', ')
              .replace(/}/g, '')
              .replace(/{/g, '')
              .split(', ')
              .map((language, i) => (
                <div className="project__card__languages__entry" key={i}>
                  {language}
                </div>
              ))}
          </div>
          <Image
            publicId={data.image}
            alt={data.image}
            className="project__card__image"
          />
        </Link>
      ) : filter != '' && filterMatch ? (
        <Link
          to="/project-detail"
          state={{ state: data }}
          onClick={() => {
            window.scrollTo({
              top: 0,
              behavior: 'smooth',
            });
          }}
          className="project__card"
        >
          <div className="project__card__name">
            {data.name.replace(/-/g, ' ').replace(/_/g, ' ')}
          </div>
          <div className="project__card__description">{data.description}</div>
          <div className="project__card__languages">
            {JSON.stringify(languages)
              .replace(/[0-9]/g, '')
              .replace(/"/g, '')
              .replace(/:/g, '')
              .replace(/,/g, ', ')
              .replace(/}/g, '')
              .replace(/{/g, '')
              .split(', ')
              .map((language, i) => (
                <div className="project__card__languages__entry" key={i}>
                  {language}
                </div>
              ))}
          </div>
          <Image
            publicId={data.image}
            alt={data.image}
            className="project__card__image"
          />
        </Link>
      ) : null}
    </>
  );
}
