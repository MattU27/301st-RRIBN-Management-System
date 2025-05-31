import React, { useState, useImperativeHandle, forwardRef } from 'react';

const RIDSForm = forwardRef((props, ref) => {
  const [formData, setFormData] = useState({
    // Reservist Personnel Information
    rank: '',
    lastName: '',
    firstName: '',
    middleName: '',
    afpsn: '',
    brSvc: '',
    afpos: '', // Note: For checkboxes, this might need to be an array or object
    sourceOfCommission: '', // Note: For checkboxes, this might need to be an array or object
    initialRank: '',
    dateOfComsnEnlist: '',
    authority: '',
    reservistClassification: '', // For radio buttons
    mobilizationCenter: '',
    designation: '', // This is the designation in Reservist Personnel Info
    squad: '',
    platoon: '',
    company: '',
    battalion: '',
    sizeOfCombatShoes: '',
    sizeOfCap: '',
    sizeOfBDA: '',
    
    // Personal Information
    presentOccupation: '',
    companyNameAddress: '',
    officeTelNr: '',
    homeAddress: '',
    townCityProvinceZip: '', // Added field from form image
    resTelNr: '',
    mobileTelNr: '',
    birthdate: '',
    birthPlace: '',
    age: '',
    religion: '',
    bloodType: '',
    tin: '',
    sssNr: '',
    philhealthNr: '',
    height: '',
    weight: '',
    maritalStatus: '', // For radio buttons
    sex: '', // For radio buttons
    fbAccount: '',
    emailAddress: '',
    specialSkills: '',
    languageDialect: '',
    
    // Additional sections
    promotions: [{ rank: '', date: '', authority: '' }],
    militaryTraining: [{ schooling: '', school: '', dateGraduated: '' }],
    awards: [{ award: '', authority: '', dateAwarded: '' }],
    dependents: [{ relation: '', name: '' }],
    education: { course: '', school: '', dateGraduated: '' }, // Object, not array
    cadOjt: [{ unit: '', purpose: '', dateStart: '', dateEnd: '' }],
    unitAssignment: [{ unit: '', authority: '', dateFrom: '', dateTo: '' }],
    // This is the 'DESIGNATION' table section, distinct from the one in Reservist Personnel Info
    designationTable: [{ position: '', authority: '', dateFrom: '', dateTo: '' }] 
  });

  useImperativeHandle(ref, () => ({
    getFormData: () => {
      return formData;
    }
  }));

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleArrayChange = (section: string, index: number, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: (prev[section as keyof typeof prev] as any[]).map((item: any, i: number) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const addArrayItem = (section: string, template: any) => {
    setFormData(prev => ({
      ...prev,
      [section]: [...(prev[section as keyof typeof prev] as any[]), template]
    }));
  };

  // Specific handler for the education object if needed, or adapt handleInputChange
  const handleEducationChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      education: {
        ...(prev.education),
        [field]: value
      }
    }));
  };

  const labelClasses = "block font-medium text-neutral-700 text-xs";
  const inputClasses = "w-full border border-neutral-500 px-1 h-6 text-neutral-900";
  const sectionHeaderClasses = "font-bold text-sm mb-3 bg-neutral-200 p-1 text-center text-neutral-800";
  const tableHeaderClasses = "border border-neutral-500 p-1 font-medium text-neutral-700";
  const tableCellClasses = "border border-neutral-500 p-0";
  const tableInputClasses = "w-full h-6 px-1 border-0 text-neutral-900 focus:ring-1 focus:ring-blue-500"; // Added focus style

  return (
    <div className="max-w-4xl mx-auto p-6 bg-white">
      <div className="border-2 border-black p-6">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-xs mb-2 text-neutral-600">
            Fill-up this form, save and send as email attachment arescom.rmis@gmail.com
          </div>
          <div className="text-xs mb-4 text-neutral-600">
            You can also print and submit a copy of this form to your nearest CDC/RCDG/ARESCOM
          </div>
          <div className="font-bold text-lg text-black">
            P H I L I P P I N E   A R M Y
          </div>
          <div className="font-bold text-lg border-b-2 border-black pb-2 mb-4 text-black">
            RESERVIST INFORMATION DATA SHEET
          </div>
        </div>

        {/* Photo and Thumbmark section */}
        <div className="flex justify-between items-start mb-4">
            <div> {/* Placeholder for any content on the left if needed */} </div>
            <div className="flex gap-4">
                <div className="border border-black w-24 h-32 flex flex-col items-center justify-center text-xs p-1">
                <span className="text-neutral-700">2x2</span>
                <span className="text-neutral-700">Photo</span>
                </div>
                <div className="border border-black w-24 h-32 flex flex-col items-center justify-center text-xs p-1">
                <span className="text-neutral-700">RIGHT</span>
                <span className="text-neutral-700">THUMBMARK</span>
                </div>
            </div>
        </div>

        {/* RESERVIST PERSONNEL INFORMATION */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>
            RESERVIST PERSONNEL INFORMATION
          </div>
          
          {/* First Row */}
          <div className="grid grid-cols-6 gap-2 mb-2 text-xs">
            <div>
              <label className={labelClasses}>Rank</label>
              <input
                type="text"
                className={inputClasses}
                value={formData.rank}
                onChange={(e) => handleInputChange('rank', e.target.value)}
              />
            </div>
            <div className="col-span-2"> {/* Last Name taking more space if needed */}
              <label className={labelClasses}>Last Name</label>
              <input
                type="text"
                className={inputClasses}
                value={formData.lastName}
                onChange={(e) => handleInputChange('lastName', e.target.value)}
              />
            </div>
            <div className="col-span-2">  {/* First Name taking more space if needed */}
              <label className={labelClasses}>First Name</label>
              <input
                type="text"
                className={inputClasses}
                value={formData.firstName}
                onChange={(e) => handleInputChange('firstName', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClasses}>Middle Name</label>
              <input
                type="text"
                className={inputClasses}
                value={formData.middleName}
                onChange={(e) => handleInputChange('middleName', e.target.value)}
              />
            </div>
             <div>
              <label className={labelClasses}>AFPSN</label>
              <input
                type="text"
                className={inputClasses}
                value={formData.afpsn}
                onChange={(e) => handleInputChange('afpsn', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClasses}>BrSVC</label>
              <input
                type="text"
                className={inputClasses}
                value={formData.brSvc}
                onChange={(e) => handleInputChange('brSvc', e.target.value)}
              />
            </div>
          </div>

          {/* AFPOS / MOS and Source of Commission */}
          <div className="grid grid-cols-2 gap-4 mb-3 text-xs">
            <div>
              <label className={`${labelClasses} mb-1`}>AFPOS / MOS</label>
              <div className="grid grid-cols-3 gap-x-2 border border-neutral-500 p-1">
                {[ 'INF', 'CAV', 'FA', 'SC', 'QMS', 'MI', 'AGS', 'FS', 'RES', 'GSC', 'MNSA', /* Add other AFPOS/MOS options if any */ ].map(option => (
                  <label key={option} className="flex items-center">
                    <input type="checkbox" className="mr-1 scale-75" 
                           name="afpos" value={option} 
                           // onChange={handleAfposChange} // Needs custom handler for multiple checkboxes
                    />
                    <span className="text-neutral-700 text-xs">{option}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={`${labelClasses} mb-1`}>Source of Commission / Enlistment</label>
              <div className="grid grid-cols-3 gap-x-2 border border-neutral-500 p-1">
                {[ 'MNSA', 'ELECTED', 'PRES APPOINTEE', 'DEGREE HOLDER', 'MS-43', 'POTC', 'CBT COMMISSION', 'EX-AFP', 'ROTC', 'CMT', 'BCMT', 'SBCMT', 'CAA (CAFGU)', 'MOT (PAARU)' ].map(option => (
                  <label key={option} className="flex items-center">
                    <input type="checkbox" className="mr-1 scale-75"
                           name="sourceOfCommission" value={option}
                           // onChange={handleSourceOfCommissionChange} // Needs custom handler
                    />
                    <span className="text-neutral-700 text-xs">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Commission Details & Reservist Classification */}
          <div className="grid grid-cols-10 gap-2 mb-3 text-xs">
            <div className="col-span-2">
              <label className={labelClasses}>Initial Rank</label>
              <input type="text" className={inputClasses} value={formData.initialRank} onChange={(e) => handleInputChange('initialRank', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Date of Comsn/Enlist</label>
              <input type="text" placeholder="dd-mmm-yy" className={inputClasses} value={formData.dateOfComsnEnlist} onChange={(e) => handleInputChange('dateOfComsnEnlist', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Authority</label>
              <input type="text" className={inputClasses} value={formData.authority} onChange={(e) => handleInputChange('authority', e.target.value)} />
            </div>
            <div className="col-span-4">
              <label className={labelClasses}>Reservist Classification</label>
              <div className="flex gap-2 items-center h-6">
                {['READY', 'STANDBY', 'RETIRED'].map(option => (
                  <label key={option} className="flex items-center">
                    <input type="radio" name="reservistClassification" value={option} 
                           checked={formData.reservistClassification === option}
                           onChange={(e) => handleInputChange('reservistClassification', e.target.value)}
                           className="mr-1 scale-75" />
                    <span className="text-neutral-700 text-xs">{option}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Unit Organization and Sizes */}
          <div className="grid grid-cols-12 gap-2 text-xs mb-2">
            <div className="col-span-2">
              <label className={labelClasses}>Mobilization Center</label>
              <input type="text" className={inputClasses} value={formData.mobilizationCenter} onChange={(e) => handleInputChange('mobilizationCenter', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Designation</label>
              <input type="text" className={inputClasses} value={formData.designation} onChange={(e) => handleInputChange('designation', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Squad/Team/Section</label>
              <input type="text" className={inputClasses} value={formData.squad} onChange={(e) => handleInputChange('squad', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Platoon</label>
              <input type="text" className={inputClasses} value={formData.platoon} onChange={(e) => handleInputChange('platoon', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Company</label>
              <input type="text" className={inputClasses} value={formData.company} onChange={(e) => handleInputChange('company', e.target.value)} />
            </div>
             <div className="col-span-2">
              <label className={labelClasses}>Battalion / Brigade / Division</label>
              <input type="text" className={inputClasses} value={formData.battalion} onChange={(e) => handleInputChange('battalion', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-12 gap-2 text-xs">
            <div className="col-span-2">
              <label className={labelClasses}>Size of Combat Shoes</label>
              <input type="text" className={inputClasses} value={formData.sizeOfCombatShoes} onChange={(e) => handleInputChange('sizeOfCombatShoes', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Size of Cap (cm)</label>
              <input type="text" className={inputClasses} value={formData.sizeOfCap} onChange={(e) => handleInputChange('sizeOfCap', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Size of BDA</label> {/* BDU in image, BDA in formData */}
              <input type="text" className={inputClasses} value={formData.sizeOfBDA} onChange={(e) => handleInputChange('sizeOfBDA', e.target.value)} />
            </div>
          </div>
        </div>

        {/* PERSONAL INFORMATION */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>PERSONAL INFORMATION</div>
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
            <div>
              <label className={labelClasses}>Present Occupation</label>
              <input type="text" className={inputClasses} value={formData.presentOccupation} onChange={(e) => handleInputChange('presentOccupation', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Company Name & Address</label>
              <input type="text" className={inputClasses} value={formData.companyNameAddress} onChange={(e) => handleInputChange('companyNameAddress', e.target.value)} />
            </div>
             <div>
                <label className={labelClasses}>Office Tel. Nr</label>
                <input type="text" className={inputClasses} value={formData.officeTelNr} onChange={(e) => handleInputChange('officeTelNr', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
            <div className="col-span-2">
              <label className={labelClasses}>Home Address: Street/Barangay</label>
              <input type="text" className={inputClasses} value={formData.homeAddress} onChange={(e) => handleInputChange('homeAddress', e.target.value)} />
            </div>
            <div>
              <label className={labelClasses}>Res. Tel. Nr</label>
              <input type="text" className={inputClasses} value={formData.resTelNr} onChange={(e) => handleInputChange('resTelNr', e.target.value)} />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-2 text-xs">
            <div className="col-span-2">
              <label className={labelClasses}>Town/City/Province/ZIP Code</label>
              <input type="text" className={inputClasses} 
                     value={formData.townCityProvinceZip} onChange={(e) => handleInputChange('townCityProvinceZip', e.target.value)} />
            </div>
            <div>
                <label className={labelClasses}>Mobile Tel Nr</label>
                <input type="text" className={inputClasses} value={formData.mobileTelNr} onChange={(e) => handleInputChange('mobileTelNr', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 mb-2 text-xs">
            <div className="col-span-2">
              <label className={labelClasses}>Birthdate (dd-mmm-yy)</label>
              <input type="text" className={inputClasses} value={formData.birthdate} onChange={(e) => handleInputChange('birthdate', e.target.value)} />
            </div>
            <div className="col-span-3">
              <label className={labelClasses}>Birth Place (Municipality, Province)</label>
              <input type="text" className={inputClasses} value={formData.birthPlace} onChange={(e) => handleInputChange('birthPlace', e.target.value)} />
            </div>
            <div className="col-span-1">
              <label className={labelClasses}>Age</label>
              <input type="text" className={inputClasses} value={formData.age} onChange={(e) => handleInputChange('age', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Religion</label>
              <input type="text" className={inputClasses} value={formData.religion} onChange={(e) => handleInputChange('religion', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>Blood Type</label>
              <input type="text" className={inputClasses} value={formData.bloodType} onChange={(e) => handleInputChange('bloodType', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 mb-2 text-xs">
            <div className="col-span-2">
              <label className={labelClasses}>T.I.N.</label>
              <input type="text" className={inputClasses} value={formData.tin} onChange={(e) => handleInputChange('tin', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>SSS Nr.</label>
              <input type="text" className={inputClasses} value={formData.sssNr} onChange={(e) => handleInputChange('sssNr', e.target.value)} />
            </div>
            <div className="col-span-2">
              <label className={labelClasses}>PHILHEALTH Nr.</label>
              <input type="text" className={inputClasses} value={formData.philhealthNr} onChange={(e) => handleInputChange('philhealthNr', e.target.value)} />
            </div>
            <div className="col-span-1">
              <label className={labelClasses}>Height: cm</label>
              <input type="text" className={inputClasses} value={formData.height} onChange={(e) => handleInputChange('height', e.target.value)} />
            </div>
            <div className="col-span-1">
              <label className={labelClasses}>Weight: kgs</label>
              <input type="text" className={inputClasses} value={formData.weight} onChange={(e) => handleInputChange('weight', e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-2 text-xs">
            <div>
              <label className={`${labelClasses} mb-1`}>Marital Status</label>
              <div className="flex gap-x-4">
                {['Single', 'Married', 'Widow', 'Separated'].map(status => (
                  <label key={status} className="flex items-center">
                    <input type="radio" name="maritalStatus" value={status} 
                           checked={formData.maritalStatus === status}
                           onChange={(e) => handleInputChange('maritalStatus', e.target.value)}
                           className="mr-1 scale-75" />
                    <span className="text-neutral-700 text-xs">{status}</span>
                  </label>
                ))}
              </div>
            </div>
            <div>
              <label className={`${labelClasses} mb-1`}>Sex</label>
              <div className="flex gap-x-4">
                {['Male', 'Female'].map(sex => (
                  <label key={sex} className="flex items-center">
                    <input type="radio" name="sex" value={sex} 
                           checked={formData.sex === sex}
                           onChange={(e) => handleInputChange('sex', e.target.value)}
                           className="mr-1 scale-75" />
                    <span className="text-neutral-700 text-xs">{sex}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-12 gap-2 text-xs">
            <div className="col-span-3">
                <label className={labelClasses}>FB Account:</label>
                <input type="text" className={inputClasses} value={formData.fbAccount} onChange={(e) => handleInputChange('fbAccount', e.target.value)} />
            </div>
            <div className="col-span-3">
                <label className={labelClasses}>Email Address:</label>
                <input type="email" className={inputClasses} value={formData.emailAddress} onChange={(e) => handleInputChange('emailAddress', e.target.value)} />
            </div>
            <div className="col-span-3">
                <label className={labelClasses}>Special Skills:</label>
                <input type="text" className={inputClasses} value={formData.specialSkills} onChange={(e) => handleInputChange('specialSkills', e.target.value)} />
            </div>
            <div className="col-span-3">
                <label className={labelClasses}>Language/Dialect Spoken:</label>
                <input type="text" className={inputClasses} value={formData.languageDialect} onChange={(e) => handleInputChange('languageDialect', e.target.value)} />
            </div>
          </div>
        </div>

        {/* PROMOTION/DEMOTION */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>PROMOTION/DEMOTION</div>
          <table className="w-full border-collapse border border-neutral-500 text-xs">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Rank</th>
                <th className={tableHeaderClasses}>Date of Rank</th>
                <th className={tableHeaderClasses}>Authority</th>
              </tr>
            </thead>
            <tbody>
              {formData.promotions.map((promo, index) => (
                <tr key={index}>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={promo.rank} onChange={(e) => handleArrayChange('promotions', index, 'rank', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={promo.date} onChange={(e) => handleArrayChange('promotions', index, 'date', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={promo.authority} onChange={(e) => handleArrayChange('promotions', index, 'authority', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => addArrayItem('promotions', { rank: '', date: '', authority: '' })} className="text-xs mt-1 text-blue-600 hover:text-blue-800">+ Add Promotion</button>
        </div>

        {/* MILITARY TRAINING/SEMINAR/SCHOOLING */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>MILITARY TRAINING/SEMINAR/SCHOOLING</div>
          <table className="w-full border-collapse border border-neutral-500 text-xs">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Military Schooling</th>
                <th className={tableHeaderClasses}>School</th>
                <th className={tableHeaderClasses}>Date Graduated</th>
              </tr>
            </thead>
            <tbody>
              {formData.militaryTraining.map((training, index) => (
                <tr key={index}>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={training.schooling} onChange={(e) => handleArrayChange('militaryTraining', index, 'schooling', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={training.school} onChange={(e) => handleArrayChange('militaryTraining', index, 'school', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={training.dateGraduated} onChange={(e) => handleArrayChange('militaryTraining', index, 'dateGraduated', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => addArrayItem('militaryTraining', { schooling: '', school: '', dateGraduated: '' })} className="text-xs mt-1 text-blue-600 hover:text-blue-800">+ Add Training</button>
        </div>

        {/* AWARDS AND DECORATION */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>AWARDS AND DECORATION</div>
          <table className="w-full border-collapse border border-neutral-500 text-xs">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Awards/Decoration</th>
                <th className={tableHeaderClasses}>Authority</th>
                <th className={tableHeaderClasses}>Date Awarded</th>
              </tr>
            </thead>
            <tbody>
              {formData.awards.map((awardItem, index) => (
                <tr key={index}>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={awardItem.award} onChange={(e) => handleArrayChange('awards', index, 'award', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={awardItem.authority} onChange={(e) => handleArrayChange('awards', index, 'authority', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={awardItem.dateAwarded} onChange={(e) => handleArrayChange('awards', index, 'dateAwarded', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => addArrayItem('awards', { award: '', authority: '', dateAwarded: '' })} className="text-xs mt-1 text-blue-600 hover:text-blue-800">+ Add Award</button>
        </div>

        {/* DEPENDENTS */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>DEPENDENTS</div>
          <table className="w-full border-collapse border border-neutral-500 text-xs">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Relation</th>
                <th className={tableHeaderClasses}>Name</th>
              </tr>
            </thead>
            <tbody>
              {formData.dependents.map((dependent, index) => (
                <tr key={index}>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={dependent.relation} onChange={(e) => handleArrayChange('dependents', index, 'relation', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={dependent.name} onChange={(e) => handleArrayChange('dependents', index, 'name', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => addArrayItem('dependents', { relation: '', name: '' })} className="text-xs mt-1 text-blue-600 hover:text-blue-800">+ Add Dependent</button>
        </div>
        
        {/* HIGHEST EDUCATIONAL ATTAINMENT */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>HIGHEST EDUCATIONAL ATTAINMENT</div>
          <table className="w-full border-collapse border border-neutral-500 text-xs">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Course</th>
                <th className={tableHeaderClasses}>School</th>
                <th className={tableHeaderClasses}>Date Graduated</th>
              </tr>
            </thead>
            <tbody>
              <tr> {/* Note: formData.education is an object, not an array */}
                <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={formData.education.course} onChange={(e) => handleEducationChange('course', e.target.value)} /></td>
                <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={formData.education.school} onChange={(e) => handleEducationChange('school', e.target.value)} /></td>
                <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={formData.education.dateGraduated} onChange={(e) => handleEducationChange('dateGraduated', e.target.value)} /></td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* CAD/OJT/ADT */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>CAD/OJT/ADT</div>
          <table className="w-full border-collapse border border-neutral-500 text-xs">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Unit</th>
                <th className={tableHeaderClasses}>Purpose / Authority</th>
                <th className={tableHeaderClasses}>Date Start</th>
                <th className={tableHeaderClasses}>Date End</th>
              </tr>
            </thead>
            <tbody>
              {formData.cadOjt.map((item, index) => (
                <tr key={index}>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.unit} onChange={(e) => handleArrayChange('cadOjt', index, 'unit', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.purpose} onChange={(e) => handleArrayChange('cadOjt', index, 'purpose', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.dateStart} onChange={(e) => handleArrayChange('cadOjt', index, 'dateStart', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.dateEnd} onChange={(e) => handleArrayChange('cadOjt', index, 'dateEnd', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => addArrayItem('cadOjt', { unit: '', purpose: '', dateStart: '', dateEnd: '' })} className="text-xs mt-1 text-blue-600 hover:text-blue-800">+ Add CAD/OJT/ADT</button>
        </div>

        {/* UNIT ASSIGNMENT */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>UNIT ASSIGNMENT</div>
          <table className="w-full border-collapse border border-neutral-500 text-xs">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Unit</th>
                <th className={tableHeaderClasses}>Authority</th>
                <th className={tableHeaderClasses}>Date From</th>
                <th className={tableHeaderClasses}>Date To</th>
              </tr>
            </thead>
            <tbody>
              {formData.unitAssignment.map((item, index) => (
                <tr key={index}>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.unit} onChange={(e) => handleArrayChange('unitAssignment', index, 'unit', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.authority} onChange={(e) => handleArrayChange('unitAssignment', index, 'authority', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.dateFrom} onChange={(e) => handleArrayChange('unitAssignment', index, 'dateFrom', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.dateTo} onChange={(e) => handleArrayChange('unitAssignment', index, 'dateTo', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => addArrayItem('unitAssignment', { unit: '', authority: '', dateFrom: '', dateTo: '' })} className="text-xs mt-1 text-blue-600 hover:text-blue-800">+ Add Unit Assignment</button>
        </div>
        
        {/* DESIGNATION (Table) */}
        <div className="mb-6">
          <div className={sectionHeaderClasses}>DESIGNATION</div>
          <table className="w-full border-collapse border border-neutral-500 text-xs">
            <thead>
              <tr>
                <th className={tableHeaderClasses}>Position</th>
                <th className={tableHeaderClasses}>Authority</th>
                <th className={tableHeaderClasses}>Date From</th>
                <th className={tableHeaderClasses}>Date To</th>
              </tr>
            </thead>
            <tbody>
              {formData.designationTable.map((item, index) => (
                <tr key={index}>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.position} onChange={(e) => handleArrayChange('designationTable', index, 'position', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.authority} onChange={(e) => handleArrayChange('designationTable', index, 'authority', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.dateFrom} onChange={(e) => handleArrayChange('designationTable', index, 'dateFrom', e.target.value)} /></td>
                  <td className={tableCellClasses}><input type="text" className={tableInputClasses} value={item.dateTo} onChange={(e) => handleArrayChange('designationTable', index, 'dateTo', e.target.value)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          <button type="button" onClick={() => addArrayItem('designationTable', { position: '', authority: '', dateFrom: '', dateTo: '' })} className="text-xs mt-1 text-blue-600 hover:text-blue-800">+ Add Designation</button>
        </div>

        {/* Certification and Signature */}
        <div className="mt-8 mb-4 text-center text-xs text-neutral-700">
          I HEREBY CERTIFY that all entries in this document are correct.
        </div>
        <div className="flex justify-around items-end mt-12" style={{ minHeight: '100px' }}>
            <div>{/* Intentionally blank for spacing if needed */}</div>
            <div className="text-center">
                <div className="border-b-2 border-black w-64 h-12"></div>
                <div className="text-xs font-medium mt-1 text-neutral-800">SIGNATURE</div>
            </div>
        </div>
         <div className="flex justify-end items-end mt-12 pr-8" style={{ minHeight: '50px' }}>
            <div className="text-center">
                <div className="border-b-2 border-black w-64 h-8"></div>
                <div className="text-xs font-medium mt-1 text-neutral-800">Attesting Personnel</div>
            </div>
        </div>

        <div className="text-right text-xs mt-12 italic text-neutral-600">
            s2019
        </div>
        <div className="text-xs mt-4 text-neutral-600">
            <hr className="border-black mb-1"/>
            Note: This will form part of the Reservist's MPF to be filed at HQS ARPMC(P), ARESCOM and Sent a Scan or E-Copy to <a href="mailto:arescom.rmis@gmail.com" className="text-blue-600 hover:text-blue-700">arescom.rmis@gmail.com</a>
            <br/>
            Note: Other information that needs Supporting Documents shall be attached to be valid.
        </div>

      </div>
    </div>
  );
});

export default RIDSForm; 