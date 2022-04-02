import axios from 'axios';
import React, { useEffect, useState } from 'react';
import { PortfolioFilter, ProjectCard } from '../components';

export default function Portfolio() {
  const [filter, setFilter] = useState('');
  const [limit, setLimit] = useState(9);
  const [portfolioData, setPortfolioData] = useState([]);
  useEffect(() => {
    axios
      .get(
        `${
          import.meta.env.PROD
            ? 'https://mehfooz-ur-rehman.herokuapp.com/'
            : 'http://localhost:9000/'
        }api/v1/get_project`
      )
      .then((res) => {
        setPortfolioData(res.data);
      })
      .catch((err) => {
        console.log(err);
      });
  }, []);

  return (
    <>
      <div className="screen__header">
        <div className="screen__header__left">
          <div className="screen__header__name">Portfolio</div>
          <div className="screen__header__breadcrum">
            <div className="screen__header__breadcrum__bar"></div> Home /
            Portfolio
          </div>
        </div>
        <div className="screen__header__right">
          <PortfolioFilters setFilter={setFilter} />
        </div>
      </div>
      <div className="portfolio__projects">
        {portfolioData
          .filter((item, i) => (filter === '' ? i < limit : i))
          .map((data, i) => {
            return <ProjectCard data={data} key={i} filter={filter} />;
          })}
      </div>

      <div className="porfolio__loadmore">
        {filter === '' ? (
          <button
            title="load more"
            className="contact__section__right__btn"
            onClick={() => {
              setLimit(limit + limit);
            }}
          >
            Load More
          </button>
        ) : null}
      </div>
    </>
  );
}

function PortfolioFilters({ setFilter }) {
  return (
    <div className="portfolio__filters">
      <PortfolioFilter
        onClick={() => {
          setFilter('');
        }}
        defaultChecked={true}
      >
        All
      </PortfolioFilter>
      <PortfolioFilter
        onClick={() => {
          setFilter('Web App');
        }}
      >
        Web App
      </PortfolioFilter>
      <PortfolioFilter
        onClick={() => {
          setFilter('Mobile App');
        }}
      >
        Mobile App
      </PortfolioFilter>
    </div>
  );
}
