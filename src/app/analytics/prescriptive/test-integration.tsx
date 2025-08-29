/**
 * TEST INTEGRATION COMPONENT
 * Add this to your prescriptive analytics page to test the EO 212 algorithm
 */

import React, { useState } from 'react';
import { testAlgorithmIntegration, generateTestReport } from '@/utils/testPromotionAlgorithm';
import { Download, TestTube, CheckCircle, AlertCircle, FileText } from 'lucide-react';

interface TestIntegrationProps {
  onTestComplete?: (data: any) => void;
}

export const TestIntegration: React.FC<TestIntegrationProps> = ({ onTestComplete }) => {
  const [isTestMode, setIsTestMode] = useState(false);
  const [testResults, setTestResults] = useState<any>(null);
  const [isRunningTest, setIsRunningTest] = useState(false);
  const [testReport, setTestReport] = useState<string>('');

  const runAlgorithmTest = async () => {
    setIsRunningTest(true);
    try {
      console.log('🧪 Starting EO 212 Algorithm Test...');
      
      const result = await testAlgorithmIntegration();
      setTestResults(result);
      
      if (result.success && onTestComplete) {
        onTestComplete(result.data);
      }
      
      // Generate detailed report
      const report = generateTestReport();
      setTestReport(report);
      
      console.log('✅ Test completed:', result);
      
    } catch (error) {
      console.error('❌ Test failed:', error);
      setTestResults({
        success: false,
        data: null,
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      });
    } finally {
      setIsRunningTest(false);
    }
  };

  const downloadTestReport = () => {
    const blob = new Blob([testReport], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `promotion_algorithm_test_report_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-4 mb-4 border border-blue-200 rounded-lg bg-blue-50">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <TestTube className="w-5 h-5 text-blue-600" />
          <h3 className="text-sm font-semibold text-blue-900">
            EO 212 Algorithm Testing
          </h3>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setIsTestMode(!isTestMode)}
            className="px-3 py-1 text-xs text-blue-600 border border-blue-600 rounded hover:bg-blue-100"
          >
            {isTestMode ? 'Hide Test Panel' : 'Show Test Panel'}
          </button>
        </div>
      </div>

      {isTestMode && (
        <div className="space-y-3">
          <div className="p-3 bg-white border border-gray-200 rounded">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Algorithm Test Suite</h4>
            <p className="text-xs text-gray-600 mb-3">
              Test the EO 212-based promotion algorithm with sample personnel data. 
              This will validate the algorithm against policy requirements and compare 
              results with the original scoring method.
            </p>
            
            <div className="flex gap-2">
              <button
                onClick={runAlgorithmTest}
                disabled={isRunningTest}
                className="flex items-center gap-1 px-3 py-2 text-sm text-white bg-blue-600 rounded hover:bg-blue-700 disabled:bg-blue-300"
              >
                {isRunningTest ? (
                  <>
                    <div className="w-3 h-3 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                    Running Test...
                  </>
                ) : (
                  <>
                    <TestTube size={14} />
                    Run EO 212 Algorithm Test
                  </>
                )}
              </button>
              
              {testReport && (
                <button
                  onClick={downloadTestReport}
                  className="flex items-center gap-1 px-3 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50"
                >
                  <Download size={14} />
                  Download Report
                </button>
              )}
            </div>
          </div>

          {testResults && (
            <div className="p-3 bg-white border border-gray-200 rounded">
              <div className="flex items-center gap-2 mb-2">
                {testResults.success ? (
                  <CheckCircle className="w-4 h-4 text-green-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-red-600" />
                )}
                <h4 className="text-sm font-medium text-gray-900">Test Results</h4>
              </div>
              
              <div className={`p-2 rounded text-xs ${
                testResults.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
              }`}>
                {testResults.message}
              </div>

              {testResults.success && testResults.data && (
                <div className="mt-3 space-y-2">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">Total Personnel</div>
                      <div className="text-lg font-bold text-blue-600">
                        {testResults.data.personnel?.length || 0}
                      </div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-medium">EO 212 Compliant</div>
                      <div className="text-lg font-bold text-green-600">
                        {testResults.data.policyCompliance?.policyCompliant || 0}
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-2 bg-yellow-50 rounded">
                    <div className="text-xs font-medium text-yellow-800 mb-1">Algorithm Metadata</div>
                    <div className="text-xs text-yellow-700">
                      Policy Basis: {testResults.data.algorithmMetadata?.policyBasis}
                    </div>
                    <div className="text-xs text-yellow-700">
                      Version: {testResults.data.algorithmMetadata?.version}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="p-3 bg-white border border-gray-200 rounded">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Testing Instructions</h4>
            <ol className="text-xs text-gray-600 space-y-1 list-decimal list-inside">
              <li>Click "Run EO 212 Algorithm Test" to execute the test suite</li>
              <li>The test will generate sample personnel data and process it through both algorithms</li>
              <li>Compare the results between original and EO 212-based scoring</li>
              <li>Download the detailed test report for documentation</li>
              <li>If successful, the test data will populate your analytics dashboard</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};

export default TestIntegration;
