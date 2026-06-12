export interface CurriculumSlide {
  title: string;
  layoutType: string;
  imageUrl: string | null;
  bullets: string[];
}

export interface CurriculumQuiz {
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: string;
  explanation: string;
}

export interface CurriculumModule {
  slug: string;
  name: string;
  description: string;
  level: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';
  tier: 'Fundamentals' | 'Associate' | 'Professional';
  xpPoints: number;
  estimatedMinutes: number;
  orderIndex: number;
  slides: CurriculumSlide[];
  quiz: CurriculumQuiz[];
}

export const TOPIC = {
  name: 'AWS',
  slug: 'aws-core',
  description: 'Master the core AWS services and cloud architecture patterns.',
  orderIndex: 0,
};

const LETTERS = ['A', 'B', 'C', 'D'] as const;

function q(
  question: string,
  options: string[],
  answerIndex: number,
  explanation: string,
): CurriculumQuiz {
  return {
    question,
    optionA: options[0],
    optionB: options[1],
    optionC: options[2],
    optionD: options[3],
    correctAnswer: LETTERS[answerIndex],
    explanation,
  };
}

export const CURRICULUM_MODULES: CurriculumModule[] = [
  // ── BEGINNER (orderIndex 0-5) ──────────────────────────────────
  {
    slug: 'fundamentals',
    name: 'AWS Fundamentals',
    description: 'Learn the core global infrastructure, cloud concepts, Regions, Availability Zones, and basic AWS services.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 50,
    estimatedMinutes: 15,
    orderIndex: 0,
    slides: [
      {
        title: 'AWS Global Infrastructure Overview',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS cloud infrastructure is built around Regions and Availability Zones.',
          'A Region is a physical location in the world where AWS has multiple Availability Zones.',
          'Availability Zones consist of one or more discrete data centers, each with redundant power, networking, and connectivity.',
        ],
      },
      {
        title: 'Availability Zones (AZs) Details',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AZs are isolated from each other to prevent disasters from spreading.',
          'They are connected through low-latency, high-speed fiber-optic links.',
          'Designing systems to run across multiple AZs ensures High Availability (HA) and Fault Tolerance.',
        ],
      },
      {
        title: 'Edge Locations & CloudFront',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Edge Locations are endpoints used by AWS to cache assets globally.',
          'They work in tandem with Amazon CloudFront (CDN) to reduce latency for end-users.',
          'They are separated from standard AWS Regions to optimize content delivery speed.',
        ],
      },
      {
        title: 'Shared Responsibility Model',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS is responsible for "Security of the Cloud" (hardware, hypervisors, physical security).',
          'The customer is responsible for "Security in the Cloud" (data encryption, OS configuration, IAM users, firewall settings).',
          'Understanding this model is critical for passing AWS Certification exams.',
        ],
      },
    ],
    quiz: [
      q(
        'Which of the following consists of one or more discrete data centers with redundant power, networking, and connectivity in an AWS Region?',
        ['Edge Location', 'Availability Zone', 'Direct Connect Endpoint', 'VPC Subnet'],
        1,
        'An Availability Zone (AZ) is one or more discrete data centers with redundant power, networking, and connectivity in an AWS Region.',
      ),
    ],
  },
  {
    slug: 'ec2',
    name: 'Amazon EC2',
    description: 'Provision and configure virtual servers (compute instances) in the cloud with custom operating systems.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 50,
    estimatedMinutes: 20,
    orderIndex: 1,
    slides: [
      {
        title: 'Introduction to EC2',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon Elastic Compute Cloud (EC2) provides secure, resizable compute capacity in the cloud.',
          'It enables you to boot virtual machines, called "instances", running various operating systems (Linux, Windows).',
          'You can select from multiple instance types optimized for compute, memory, storage, or graphics.',
        ],
      },
      {
        title: 'Instance Types & Purchasing Options',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'EC2 Instance Classes: general purpose (T and M), compute optimized (C), memory optimized (R).',
          'On-Demand: Pay per second, most flexible, no commitment.',
          'Savings Plans / Reserved: Commit to 1 or 3 years for up to 72% discount.',
          'Spot Instances: Bid on spare AWS capacity at up to 90% discount, but can be terminated with a 2-minute warning.',
        ],
      },
      {
        title: 'Firewall Security: Security Groups',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Security Groups act as virtual firewalls at the instance level.',
          'They are stateful: if you allow inbound traffic on port 80, outbound responses are automatically permitted.',
          'You can only define ALLOW rules in Security Groups, not DENY rules.',
        ],
      },
      {
        title: 'Connecting to EC2',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'You connect to Linux instances using SSH (Secure Shell) on Port 22.',
          'Windows instances are accessed using RDP (Remote Desktop Protocol) on Port 3389.',
          'SSH requires a secure PEM/PPK cryptographic private key pair generated during instance creation.',
        ],
      },
    ],
    quiz: [
      q(
        'Which firewall mechanism is stateful and operates at the Amazon EC2 instance level to control traffic?',
        ['Network ACL (NACL)', 'Security Group', 'Route Table', 'Internet Gateway'],
        1,
        'Security groups are stateful firewalls that control inbound and outbound traffic at the instance level. Network ACLs are stateless and operate at the subnet level.',
      ),
    ],
  },
  {
    slug: 's3',
    name: 'Amazon S3',
    description: 'Store objects (files) securely at massive scale with low latency and high availability.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 50,
    estimatedMinutes: 15,
    orderIndex: 2,
    slides: [
      {
        title: 'Object Storage vs Block Storage',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon Simple Storage Service (S3) is an object storage service, perfect for flat files (images, logs, videos).',
          'Unlike block storage (like EC2 hard drives), objects are accessed via unique HTTP keys (URLs).',
          'S3 offers 11 nines of durability (99.999999999%), meaning files are replicated across multiple physical facilities.',
        ],
      },
      {
        title: 'S3 Storage Classes',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'S3 Standard: Active, high-frequency access files.',
          'S3 Standard-IA (Infrequent Access): Less active, but needs instant retrieval if requested.',
          'S3 Intelligent-Tiering: Automatically transitions files to optimize cost based on access history.',
          'S3 Glacier & Glacier Deep Archive: Colder offline backups, retrieval times from minutes to 12 hours.',
        ],
      },
      {
        title: 'Security & Bucket Policies',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'By default, all S3 buckets are private and block all public access.',
          'You can configure S3 Bucket Policies (JSON documents) to grant read/write permissions to users or groups.',
          'Access can also be restricted using Identity Access Management (IAM) policies or access control lists (ACLs).',
        ],
      },
      {
        title: 'Versioning & Lifecycle Rules',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Versioning stores duplicate copies of objects upon modification or deletion, shielding files from accidents.',
          'Lifecycle rules automatically migrate objects between storage tiers (e.g., Standard -> Archive after 30 days) to optimize pricing.',
        ],
      },
    ],
    quiz: [
      q(
        'You want to automatically transition raw logs to a colder storage class after 30 days and delete them after 90 days. Which S3 feature should you use?',
        ['S3 Bucket Policies', 'S3 Lifecycle Rules', 'S3 Cross-Region Replication', 'S3 Object Locking'],
        1,
        'S3 Lifecycle Rules allow you to define transitions of objects between different storage classes (e.g. Standard to Glacier) and set deletion schedules.',
      ),
    ],
  },
  {
    slug: 'iam',
    name: 'AWS IAM',
    description: 'Manage identities, permissions, and roles to secure access to your AWS environment.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 50,
    estimatedMinutes: 15,
    orderIndex: 3,
    slides: [
      {
        title: 'Introduction to IAM',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS Identity and Access Management (IAM) controls WHO can access WHAT resources in your AWS account.',
          'IAM is a global service; it does not operate in individual AWS regions.',
          'Key entities include: Root Account, Users, Groups, Policies, and Roles.',
        ],
      },
      {
        title: 'Root Account vs IAM Users',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'The Root Account is the identity used to create the AWS account, possessing unrestricted permissions.',
          'Best practice is to lock the root access keys and use IAM Users or Single Sign-On (SSO) for daily tasks.',
          'Always enable Multi-Factor Authentication (MFA) on the root account and administrator accounts.',
        ],
      },
      {
        title: 'IAM Groups & Policies',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'IAM Groups are collections of users (e.g., Developers, Admins). Permissions are applied directly to the group.',
          'IAM Policies are JSON documents that define allowed/denied API actions.',
          'Policy Example: "Effect: Allow, Action: s3:GetObject, Resource: arn:aws:s3:::my-bucket/*".',
        ],
      },
      {
        title: 'IAM Roles & Temporary Credentials',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'An IAM Role is an identity that can be assumed by trusted entities (like EC2 instances or Lambda functions).',
          'Roles do not have credentials (passwords or access keys) associated with them.',
          'Instead, assuming a role yields temporary, automatically rotating security keys, minimizing credentials leak risk.',
        ],
      },
    ],
    quiz: [
      q(
        'What is the best security practice for allowing applications running on EC2 to read from an S3 bucket?',
        ['Store static AWS Access Keys inside the code repository.', 'Attach an IAM Role with appropriate S3 read permissions to the EC2 instance.', 'Set the S3 bucket access policy to public read-write for anonymous clients.', 'Use the root account credentials to execute the application code.'],
        1,
        'Attaching an IAM Role to an EC2 instance dynamically provisions temporary credentials, eliminating the risk of hardcoded keys leaking.',
      ),
    ],
  },
  {
    slug: 'vpc',
    name: 'Amazon VPC',
    description: 'Design and deploy custom isolated virtual networks with subnets, gateways, and routing.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 50,
    estimatedMinutes: 25,
    orderIndex: 4,
    slides: [
      {
        title: 'VPC Architecture Basics',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon Virtual Private Cloud (VPC) lets you provision a logically isolated section of the AWS cloud.',
          'You define your own network layout, including IP address ranges (CIDR blocks), subnets, route tables, and gateways.',
          'A VPC is bound to a single AWS region, but subnets can span different AZs.',
        ],
      },
      {
        title: 'Public vs Private Subnets',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Subnets are segments of IP addresses within a VPC.',
          'A Public Subnet has a route table directing traffic to an Internet Gateway (IGW), allowing two-way communication with the web.',
          'A Private Subnet has no route to the IGW; its hosts cannot be reached directly from the internet.',
        ],
      },
      {
        title: 'Routing & Gateways',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Internet Gateway (IGW): Allows public instances to route to the internet.',
          'NAT Gateway: Deployed in a public subnet, it allows private instances outbound-only access for updates, blocking incoming probes.',
          'Route Tables: Network tables determining where subnet traffic is forwarded.',
        ],
      },
      {
        title: 'Network Firewalls: Security Groups vs NACLs',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Security Groups: Stateful firewalls applied at the EC2 instance level.',
          'Network Access Control Lists (NACLs): Stateless firewalls applied at the subnet level. They process inbound and outbound rules separately.',
        ],
      },
    ],
    quiz: [
      q(
        'Which VPC component translates private IP addresses to a public elastic IP, allowing private subnets to reach the internet without exposing them to incoming connections?',
        ['Internet Gateway (IGW)', 'NAT Gateway', 'Virtual Private Gateway (VGW)', 'VPC Peering Connection'],
        1,
        'A NAT Gateway translates traffic from a private subnet to the internet using its own public Elastic IP address, preventing external internet clients from directly initiating connections to private resources.',
      ),
    ],
  },
  {
    slug: 'beanstalk',
    name: 'Elastic Beanstalk',
    description: 'Deploy and scale web apps and services written in Java, .NET, PHP, Node.js, Python, Ruby, and Docker on familiar servers.',
    level: 'BEGINNER',
    tier: 'Fundamentals',
    xpPoints: 75,
    estimatedMinutes: 15,
    orderIndex: 5,
    slides: [
      {
        title: 'What is Elastic Beanstalk?',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS Elastic Beanstalk is a Platform-as-a-Service (PaaS) designed for quick web app deployment.',
          'You upload code, and Beanstalk automatically handles provisioning, load balancing, scaling, and metrics.',
          'You retain full control over the underlying EC2 instances if you wish to adjust settings later.',
        ],
      },
      {
        title: 'Web Server vs Worker Tier',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Web Server Tier: Handles HTTP requests from clients, running code on EC2 backed by an Application Load Balancer.',
          'Worker Tier: Reads messages from an Amazon SQS queue to run asynchronous tasks (like video resizing or database indexing).',
        ],
      },
      {
        title: 'Deployment Policies',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'All at Once: Replaces code on all servers concurrently. Fastest, but causes downtime.',
          'Rolling: Replaces code on a subset of instances at a time. No downtime, but capacity is temporarily reduced.',
          'Immutable: Spins up fresh instances with new code. Zero downtime, safest, but takes the longest time.',
        ],
      },
      {
        title: 'Configuration Management',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'You define software packages, system environment keys, and hooks inside `.ebextensions/` folder configuration files.',
          'Beanstalk automatically applies these rules when booting nodes.',
        ],
      },
    ],
    quiz: [
      q(
        'Which AWS service is classified as a Platform-as-a-Service (PaaS) that automates infrastructure provisioning, OS patching, and load scaling for web applications?',
        ['Amazon EC2', 'AWS Elastic Beanstalk', 'AWS CloudFormation', 'Amazon Lightsail'],
        1,
        'AWS Elastic Beanstalk is a PaaS. You simply upload your application code, and Beanstalk automatically handles the deployment details, provisioning, load balancing, scaling, and health monitoring.',
      ),
    ],
  },

  // ── INTERMEDIATE (orderIndex 6-11) ─────────────────────────────
  {
    slug: 'cloudfront',
    name: 'CloudFront',
    description: 'Distribute static and dynamic web content globally with low latency using edge cache servers.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    estimatedMinutes: 15,
    orderIndex: 6,
    slides: [
      {
        title: 'Global Content Delivery Networks',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon CloudFront is a fast content delivery network (CDN) service.',
          'It caches data at global Edge Locations, dramatically reducing loading latency for static files.',
          'It integrates seamlessly with S3 buckets, EC2 virtual hosts, and API Gateway endpoints.',
        ],
      },
      {
        title: 'Origins & Distributions',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'An Origin is the source location of the files (e.g. S3 bucket, Elastic Load Balancer).',
          'A Distribution is the cached domain name configured to distribute traffic.',
          'CloudFront queries the origin on a cache miss, then stores it at the edge for future requests.',
        ],
      },
      {
        title: 'Cache Behaviors & TTL',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Time-to-Live (TTL) values control how long files are stored in edge cache before querying the origin.',
          'Default TTL is 24 hours. You can clear cache instantly using Cache Invalidations (which may incur charges).',
        ],
      },
      {
        title: 'Origin Access Control (OAC)',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'OAC allows you to secure S3 bucket contents so they are only accessible through CloudFront.',
          'This blocks users from bypassing CDN rules or accessing the source files directly.',
        ],
      },
    ],
    quiz: [
      q(
        'How can you restrict direct access to files in an S3 bucket and force users to go through Amazon CloudFront instead?',
        ['By configuring Route 53 DNS records.', 'By setting up S3 Origin Access Control (OAC) and blocking public access on S3.', 'By encrypting the files with KMS.', 'By changing the bucket storage class to Intelligent-Tiering.'],
        1,
        'Using S3 Origin Access Control (OAC) limits bucket access exclusively to CloudFront. All other traffic, including direct anonymous S3 requests, is blocked.',
      ),
    ],
  },
  {
    slug: 'rds',
    name: 'RDS',
    description: 'Provision and scale managed relational databases (MySQL, PostgreSQL, Oracle, SQL Server) with high availability.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    estimatedMinutes: 20,
    orderIndex: 7,
    slides: [
      {
        title: 'Managed Relational Databases',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon Relational Database Service (RDS) manages relational database setups (MySQL, PostgreSQL, SQL Server).',
          'AWS takes care of OS patching, backups, storage scaling, and hardware provisioning.',
          'You retain full control over databases via standard database client tools.',
        ],
      },
      {
        title: 'Multi-AZ High Availability',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'In a Multi-AZ deployment, AWS replicates data synchronously to a hot standby instance in a different AZ.',
          'If the primary database fails, AWS automatically updates DNS records to direct connections to the standby database, minimizing downtime.',
        ],
      },
      {
        title: 'Offloading Reads: Read Replicas',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Read Replicas replicate data asynchronously for heavy read workloads.',
          'You can spin up multiple read replicas across regions, load balancing read commands to optimize primary database compute resource consumption.',
        ],
      },
      {
        title: 'RDS Backups & Restoration',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Automated Backups: Periodic daily storage backups with point-in-time recovery capabilities.',
          'Snapshots: User-initiated backups that persist even if the parent RDS DB instance is deleted.',
        ],
      },
    ],
    quiz: [
      q(
        'What is the primary benefit of deploying an Amazon RDS database in a Multi-AZ configuration?',
        ['It increases read query throughput by load balancing connections.', 'It provides high availability and automatic failover in the event of an outage.', 'It encrypts database rows automatically without overhead.', 'It allows serverless auto-scaling based on CPU loads.'],
        1,
        'Multi-AZ deployments provide high availability, data redundancy, and automated failover by replicating data synchronously to a standby instance in a different Availability Zone.',
      ),
    ],
  },
  {
    slug: 'lambda',
    name: 'Lambda',
    description: 'Execute serverless backend code in response to events (S3 changes, API Gateway calls, DynamoDB streams) without managing servers.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    estimatedMinutes: 15,
    orderIndex: 8,
    slides: [
      {
        title: 'Introduction to Serverless Compute',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS Lambda lets you execute application code without provisioning virtual instances.',
          'You only write the code functions; AWS manages the underlying operating system layers.',
          'Lambda scales automatically: from zero to thousands of parallel executions instantly.',
        ],
      },
      {
        title: 'Event-Driven Executions',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Functions run in response to event triggers, such as database updates, HTTP calls, or file uploads.',
          'Lambda supports Python, Node.js, Java, Go, Ruby, and custom runtimes via Docker containers.',
        ],
      },
      {
        title: 'Configuration Metrics',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Memory allocation: 128MB to 10GB. Allocating more memory automatically scales CPU power.',
          'Execution timeout: Maximum allowed invocation duration is 15 minutes.',
        ],
      },
      {
        title: 'Execution IAM Roles',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Lambda requires an Execution Role to interact with other AWS resources.',
          'For example, writing logs to CloudWatch or reading objects from S3 requires permissions defined in the Lambda role policy.',
        ],
      },
    ],
    quiz: [
      q(
        'Which of the following is a key characteristic of AWS Lambda compute structures?',
        ['You pay a flat monthly rate regardless of function executions.', 'Functions can execute continuously for up to 24 hours per invocation.', 'It is serverless, and charges are based on the number of requests and execution duration (per millisecond).', 'You must configure the underlying Linux OS packages manually.'],
        2,
        'AWS Lambda is a serverless compute service. You only pay for requests and duration of execution in milliseconds, with no idle server costs.',
      ),
    ],
  },
  {
    slug: 'autoscaling',
    name: 'Auto Scaling',
    description: 'Dynamically add or remove EC2 instances to maintain performance and optimize operational costs.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 20,
    estimatedMinutes: 20,
    orderIndex: 9,
    slides: [
      {
        title: 'Horizontal Scaling Mechanics',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Auto Scaling Groups (ASGs) dynamically manage EC2 fleets to absorb load fluctuations.',
          'Scaling Out: Adding instances during peak traffic hours.',
          'Scaling In: Removing instances when load decreases to optimize hosting costs.',
        ],
      },
      {
        title: 'Launch Templates',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'A Launch Template defines instance configuration parameters (AMI ID, instance type, security groups) used to provision new nodes.',
        ],
      },
      {
        title: 'ASG Size Parameters',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Minimum Size: The absolute minimum instances that must run in the group.',
          'Maximum Size: The maximum limit to prevent runaway costs.',
          'Desired Capacity: The target number of active nodes. Defaults to minimum size.',
        ],
      },
      {
        title: 'Scaling Policies',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Target Tracking: Maintain a metric value (e.g. average CPU at 50%).',
          'Step Scaling: Add nodes based on CPU threshold bands (e.g., +2 nodes if CPU > 70%).',
        ],
      },
    ],
    quiz: [
      q(
        'What is the purpose of a "Launch Template" in Amazon EC2 Auto Scaling?',
        ['It specifies the scaling schedule for the instances.', 'It defines the configuration of the EC2 instances to be launched, including AMI, type, and security groups.', 'It sets the maximum and minimum number of instances in the scaling group.', 'It configures the load balancer listener parameters.'],
        1,
        'A Launch Template specifies instance configuration parameters (AMI ID, instance type, key pairs, security groups, block devices, etc.) used by Auto Scaling to launch new instances.',
      ),
    ],
  },
  {
    slug: 'cloudwatch',
    name: 'CloudWatch',
    description: 'Monitor cloud resources and applications in real-time, collect metrics, track logs, and set alarms.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    estimatedMinutes: 15,
    orderIndex: 10,
    slides: [
      {
        title: 'Introduction to CloudWatch',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon CloudWatch provides unified monitoring and observability for AWS resources.',
          'It collects metrics (performance data), logs (application events), and trace data.',
        ],
      },
      {
        title: 'Metrics & Dashboards',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Metrics are numeric measurements collected periodically (e.g. EC2 CPU load, S3 storage size).',
          'You can create unified visual dashboards to monitor multiple services in one view.',
        ],
      },
      {
        title: 'Alarms & Actions',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'CloudWatch Alarms monitor metric thresholds.',
          'Example Action: Trigger a billing alert, auto-terminate idle instances, or send SMS alerts via SNS.',
        ],
      },
      {
        title: 'CloudWatch Logs',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Log Groups collect application logs, enabling search, filtering, and metric filters creation (like counting 404 errors).',
        ],
      },
    ],
    quiz: [
      q(
        'Which tool would you use to collect system metrics, search and analyze application log files, and configure automated alert triggers based on thresholds?',
        ['AWS CloudTrail', 'Amazon CloudWatch', 'AWS Config', 'AWS Systems Manager'],
        1,
        'Amazon CloudWatch is the monitoring and observability service. CloudTrail focuses on API call auditing, and Config tracks configuration changes.',
      ),
    ],
  },
  {
    slug: 'amazon_aurora_db',
    name: 'Amazon Aurora',
    description: 'Deploy a high-performance relational database engine compatible with MySQL and PostgreSQL built for the cloud.',
    level: 'INTERMEDIATE',
    tier: 'Associate',
    xpPoints: 75,
    estimatedMinutes: 20,
    orderIndex: 11,
    slides: [
      {
        title: 'Introduction to Amazon Aurora',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon Aurora is a cloud-native relational database engine offering high performance and availability.',
          'It is compatible with MySQL and PostgreSQL, allowing you to run existing apps without modifications.',
          'It features a distributed, fault-tolerant, self-healing storage system that auto-scales up to 128TB.',
        ],
      },
      {
        title: 'Aurora High Availability & Storage',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Aurora replicates data six ways across three Availability Zones.',
          'It tolerates the loss of up to two copies of data without affecting write availability, and three copies without affecting read availability.',
        ],
      },
      {
        title: 'Aurora Serverless',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Aurora Serverless is an on-demand, auto-scaling configuration for Aurora.',
          'It automatically starts up, shuts down, and scales capacity up or down based on your application\'s needs, so you only pay for actual database capacity used.',
        ],
      },
      {
        title: 'Aurora Global Database',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Aurora Global Database allows you to replicate data across multiple AWS Regions with low-latency reads.',
          'It supports managed, active-passive failover to a secondary region for disaster recovery.',
          'Global Database can replicate to up to five secondary regions with typical replication lag under one second.',
        ],
      },
    ],
    quiz: [
      q(
        'Which Amazon database engine offers MySQL and PostgreSQL compatibility with up to 5x the throughput of standard MySQL?',
        ['Amazon RDS MySQL', 'Amazon Aurora', 'Amazon DynamoDB', 'Amazon Redshift'],
        1,
        'Amazon Aurora is a fully-managed, high-performance relational database engine compatible with MySQL and PostgreSQL, designed to deliver up to 5x MySQL throughput.',
      ),
    ],
  },

  // ── ADVANCED (orderIndex 12-17) ────────────────────────────────
  {
    slug: 'eks',
    name: 'EKS',
    description: 'Run Kubernetes workloads natively on AWS with fully-managed master control planes.',
    level: 'ADVANCED',
    tier: 'Professional',
    xpPoints: 100,
    estimatedMinutes: 25,
    orderIndex: 12,
    slides: [
      {
        title: 'Managed Kubernetes on AWS',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon Elastic Kubernetes Service (EKS) operates Kubernetes clusters on AWS.',
          'EKS manages the Kubernetes control plane nodes across multiple availability zones automatically.',
        ],
      },
      {
        title: 'EKS Node Types',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Managed Node Groups: AWS provisions and scaling worker EC2 instances for you.',
          'AWS Fargate: Serverless compute for containers. Run pods directly without managing virtual machines.',
        ],
      },
      {
        title: 'Networking & Security',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'EKS supports VPC networking directly using the AWS VPC CNI plugin.',
        ],
      },
      {
        title: 'Integration with ALB',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Deploying an AWS Load Balancer Controller exposes pods directly using Application Load Balancers.',
        ],
      },
    ],
    quiz: [
      q(
        'In Amazon EKS, which tool allows you to deploy container pods without provisioning or managing EC2 worker nodes?',
        ['Elastic Beanstalk container profiles', 'AWS Fargate integration', 'Kubernetes NodeGroups', 'Docker Compose plugins'],
        1,
        'AWS Fargate provides serverless container compute for EKS. AWS manages node provisioning, configuration, and scaling, so you only manage Kubernetes pods.',
      ),
    ],
  },
  {
    slug: 'terraform',
    name: 'Terraform',
    description: 'Define and provision infrastructure as code (IaC) across multiple cloud providers using declarative configuration files.',
    level: 'ADVANCED',
    tier: 'Professional',
    xpPoints: 100,
    estimatedMinutes: 20,
    orderIndex: 13,
    slides: [
      {
        title: 'Infrastructure as Code Philosophy',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'IaC enables you to provision, edit, and audit cloud infrastructure using configuration files instead of manual console work.',
        ],
      },
      {
        title: 'Declarative Syntax',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Terraform uses HashiCorp Configuration Language (HCL) to declare target infrastructure properties.',
        ],
      },
      {
        title: 'The State File (`.tfstate`)',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'The state file tracks the current mapping of configurations to deployed resources.',
          'Remote Backends: Store state files in S3 and lock them via DynamoDB tables to facilitate team collaboration.',
        ],
      },
      {
        title: 'Terraform Command Lifecycle',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          '`terraform init`: Prepare workspace, download plugins.',
          '`terraform plan`: Preview changes to apply.',
          '`terraform apply`: Deploy resources in AWS.',
        ],
      },
    ],
    quiz: [
      q(
        'In Terraform, what file is used to map real-world cloud resources to your configuration, and keep track of metadata?',
        ['variables.tf', 'terraform.tfstate', '.terraform.lock.hcl', 'main.tf'],
        1,
        'The `terraform.tfstate` file is the local or remote state file that records the mapping between resources declared in configurations and the actual resources created in AWS.',
      ),
    ],
  },
  {
    slug: 'dynamodb',
    name: 'DynamoDB',
    description: 'Configure and scale Amazon DynamoDB, a fully-managed, high-throughput serverless NoSQL database.',
    level: 'ADVANCED',
    tier: 'Professional',
    xpPoints: 100,
    estimatedMinutes: 20,
    orderIndex: 14,
    slides: [
      {
        title: 'Managed NoSQL Databases',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Amazon DynamoDB is a key-value and document database that delivers single-digit millisecond performance at scale.',
        ],
      },
      {
        title: 'Primary Keys',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Partition Key (PK): Determines the physical partition of data.',
          'Sort Key (SK): Orders records within a partition. combined, they form a composite primary key.',
        ],
      },
      {
        title: 'Secondary Indexes',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Local Secondary Index (LSI): Uses the same PK but a different SK.',
          'Global Secondary Index (GSI): Uses a completely different PK and SK.',
        ],
      },
      {
        title: 'DynamoDB Streams',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Streams capture database mutations, enabling real-time actions via AWS Lambda triggers.',
        ],
      },
    ],
    quiz: [
      q(
        'Which DynamoDB feature would you implement to provide sub-millisecond read access speeds for extremely high-traffic key-value tables?',
        ['Global Secondary Indexes (GSI)', 'DynamoDB Accelerator (DAX)', 'DynamoDB Streams', 'Provisioned Capacity auto-scaling'],
        1,
        'DynamoDB Accelerator (DAX) is a fully-managed, highly available, in-memory cache for DynamoDB that reduces read response times from milliseconds to microseconds.',
      ),
    ],
  },
  {
    slug: 'sns_sqs',
    name: 'SNS & SQS',
    description: 'Decouple server applications and distribute events asynchronously using managed message queues and notification topics.',
    level: 'ADVANCED',
    tier: 'Professional',
    xpPoints: 100,
    estimatedMinutes: 15,
    orderIndex: 15,
    slides: [
      {
        title: 'Decoupling Cloud Architecture',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'SQS and SNS are messaging services that separate components, preventing network cascading failures.',
        ],
      },
      {
        title: 'Amazon SQS (Queues)',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Simple Queue Service is a message storage queue.',
          'Standard: Infinite scale, at-least-once delivery, out-of-order execution.',
          'FIFO (First-In-First-Out): Strict order, exactly-once delivery. Limit: 3000 messages/sec.',
        ],
      },
      {
        title: 'Amazon SNS (Notifications)',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Simple Notification Service is a pub/sub event publisher routing messages to subscribers (SMS, SQS, HTTP endpoints).',
        ],
      },
      {
        title: 'Fan-Out Pattern',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Publishing events to an SNS topic that forwards copies to multiple SQS queues simultaneously.',
        ],
      },
    ],
    quiz: [
      q(
        'Which integration pattern allows you to duplicate a single message published to a topic across multiple distinct queues for parallel processing?',
        ['SQS Polling client routing', 'SNS to SQS Fan-out pattern', 'Direct VPC Peering loops', 'DynamoDB stream caching'],
        1,
        'The fan-out pattern involves publishing a message to an SNS topic, which automatically replicates and pushes that message to multiple subscribed SQS queues for parallel processing.',
      ),
    ],
  },
  {
    slug: 'step_functions',
    name: 'Step Functions',
    description: 'Coordinate distributed serverless services and model business workflows as visual state machines.',
    level: 'ADVANCED',
    tier: 'Professional',
    xpPoints: 100,
    estimatedMinutes: 20,
    orderIndex: 16,
    slides: [
      {
        title: 'Orchestrating Serverless Services',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS Step Functions coordinates multiple services into automated serverless workflows.',
        ],
      },
      {
        title: 'State Machines & ASL',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Workflows are modeled as state machines written in Amazon States Language (ASL), a JSON format.',
        ],
      },
      {
        title: 'Step Types',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Task: Run a job (e.g. call Lambda).',
          'Choice: Evaluate inputs to branch path.',
          'Parallel: Execute tasks concurrently.',
        ],
      },
      {
        title: 'Failure Management',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Step Functions provides built-in error catching and retry rules, tracking failure states.',
        ],
      },
    ],
    quiz: [
      q(
        'Which AWS service allows you to coordinate multiple Lambda functions and other services into visual state machines and track execution steps?',
        ['AWS Systems Manager', 'AWS Step Functions', 'AWS CloudFormation', 'AWS OpsWorks'],
        1,
        'AWS Step Functions is a visual workflow orchestrator that lets you build, manage, and execute complex state machines combining multiple AWS services.',
      ),
    ],
  },
  {
    slug: 'cloudformation',
    name: 'CloudFormation',
    description: 'Define and deploy full AWS cloud infrastructure stacks in a single, safe, repeatable template using JSON or YAML.',
    level: 'ADVANCED',
    tier: 'Professional',
    xpPoints: 100,
    estimatedMinutes: 20,
    orderIndex: 17,
    slides: [
      {
        title: 'CloudFormation Basics',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'AWS CloudFormation is the native IaC solution for AWS, deploying groups of resources as a "Stack".',
        ],
      },
      {
        title: 'Templates Structure',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'JSON or YAML declarations containing Parameters, Resources, and Outputs.',
        ],
      },
      {
        title: 'Change Sets',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Change Sets preview stack changes prior to deployment, preventing accidents.',
        ],
      },
      {
        title: 'Drift Detection',
        layoutType: 'TEXT_ONLY',
        imageUrl: null,
        bullets: [
          'Drift checks verify stack parity, noting modifications made to active systems manually.',
        ],
      },
    ],
    quiz: [
      q(
        'In AWS CloudFormation, what component resolves resource configuration mismatches by identifying changes made to stack resources outside of CloudFormation management?',
        ['Stack Policy blocks', 'Drift Detection', 'Rollback Triggers', 'Change Sets'],
        1,
        'Drift Detection allows you to identify stack resources that have been modified or deleted outside of CloudFormation management, ensuring configuration parity.',
      ),
    ],
  },
];
