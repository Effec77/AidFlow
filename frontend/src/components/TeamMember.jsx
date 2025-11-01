import React from 'react';

const TeamMember = ({ name, photoUrl, role }) => {
  return (
    <div className="team-member">
      <div className="member-photo-container">
        <div className="member-photo">
          <img src={photoUrl} alt={`Photo of ${name}`} />
        </div>
      </div>
      <div className="member-info">
        <h3 className="member-name">{name}</h3>
        <p className="member-role">{role}</p>
      </div>
    </div>
  );
};

export default TeamMember;