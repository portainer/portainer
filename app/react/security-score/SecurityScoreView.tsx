import React from 'react';

export function SecurityScoreView() {
  return (
    <div className="row">
      <div className="col-12">
        <div className="widget">
          <div className="widget-header">
            <h2>Container Security Score</h2>
          </div>
          <div className="widget-body">
            <p>مرحباً بكِ يا فرح في لوحة تقييم أمان الحاويات!</p>
            <div className="alert alert-info">
              الحالة الحالية: <strong>85% (آمن نسبياً)</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}