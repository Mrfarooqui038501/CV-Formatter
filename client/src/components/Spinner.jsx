const Spinner = ({ size = 'medium' }) => {
  const sizeClasses = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  };

  return (
    <div className="spinner-container">
      <div className={`spinner ${sizeClasses[size]}`}></div>
    </div>
  );
};

export default Spinner;