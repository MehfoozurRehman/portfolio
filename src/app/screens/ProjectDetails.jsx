import React, { useEffect, useState } from 'react';
import { ProjectCard } from '../components';
import { ArrowRight } from 'react-feather';
import { Image } from 'cloudinary-react';
import axios from 'axios';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ProjectDetails() {
  const navigate = useNavigate();
  const { state } = useLocation();
  const [portfolioData, setPortfolioData] = useState([]);
  useEffect(() => {
    if (state != null || undefined) {
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
    } else {
      navigate('/');
    }
  }, []);
  var created_date = new Date(state.state.createdAt);

  var months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];
  var year = created_date.getFullYear();
  var month = months[created_date.getMonth()];
  var date = created_date.getDate();

  return (
    <>
      <div className="screen__header">
        <div className="screen__header__left">
          <div className="screen__header__name">Project Details</div>
          <div className="screen__header__breadcrum">
            <div className="screen__header__breadcrum__bar"></div> Home /
            Project Details
          </div>
        </div>
        <div className="screen__header__left__right"></div>
      </div>
      <div className="project__section">
        <div className="project__section__left">
          <div className="project__section__left__heading">Project Brief:</div>
          <div className="project__section__left__info">
            {state.state.description}
          </div>
          <div className="project__section__left__bar"></div>
          <div className="project__section__left__heading">
            Project Detials:
          </div>
          <div className="project__section__left__about">
            <span>Category:</span>
            {state.state.category.map((item) => item.value)}
          </div>
          <div className="project__section__left__about">
            <span>Date:</span>
            {date + '-' + month + '-' + year}
          </div>
          <div className="project__section__left__about">
            <span>Client:</span>
            {state.state.client}
          </div>
          <div className="project__section__left__link">
            {state.state.url ? (
              <a
                href={state.state.url}
                className="project__section__left__link__entry"
              >
                Launch Project
                <ArrowRight size={20} color="currentColor" />
              </a>
            ) : null}
          </div>
        </div>
        <Image
          publicId={state.state.image}
          alt="pic"
          className="project__section__right"
        />
      </div>
      <div className="project__section" style={{ marginBottom: 0 }}>
        <div className="project__section__left">
          <div className="project__section__left__heading">
            Related Projects
          </div>
        </div>
      </div>
      <div className="portfolio__projects">
        {portfolioData
          .filter((item, i) => i < 3 && item.category === state.state.category)
          .map((data, i) => (
            <ProjectCard data={data} key={i} />
          ))}
      </div>
      <div className="porfolio__loadmore"></div>
    </>
  );
}
