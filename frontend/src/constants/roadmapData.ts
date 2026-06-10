export interface QuizQuestion {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
}

export interface LearningSlide {
  title: string;
  content: string[];
  layoutType?: 'text-only' | 'text-image' | 'image-only';
  imageUrl?: string;
}

export interface ModuleData {
  id: string;
  name: string;
  points: number;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  description: string;
  iconName: string;
  estimatedTime: string;
  learningPagesCount: number;
  quizQuestionsCount: number;
  tasks: string[];
  quiz: QuizQuestion;
  learningContent: LearningSlide[];
  quizQuestions?: QuizQuestion[];
}

// 1. Initial 17 Core Modules defined statically with detailed text
const staticModules: ModuleData[] = [
  // Beginner (6)
  {
    id: 'fundamentals',
    name: 'AWS Fundamentals',
    points: 50,
    level: 'Beginner',
    description: 'Learn the core global infrastructure, cloud concepts, Regions, Availability Zones, and basic AWS services.',
    iconName: 'Globe',
    estimatedTime: '15 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Learn about AWS Regions and Availability Zones.', 'Understand AWS Global Infrastructure and edge locations.', 'Explore the Shared Responsibility Model.', 'Differentiate between IaaS, PaaS, and SaaS.'],
    quiz: {
      question: 'Which of the following consists of one or more discrete data centers with redundant power, networking, and connectivity in an AWS Region?',
      options: ['Edge Location', 'Availability Zone', 'Direct Connect Endpoint', 'VPC Subnet'],
      answerIndex: 1,
      explanation: 'An Availability Zone (AZ) is one or more discrete data centers with redundant power, networking, and connectivity in an AWS Region.'
    },
    learningContent: [
      { title: 'AWS Global Infrastructure Overview', content: ['AWS cloud infrastructure is built around Regions and Availability Zones.', 'A Region is a physical location in the world where AWS has multiple Availability Zones.', 'Availability Zones consist of one or more discrete data centers, each with redundant power, networking, and connectivity.'] },
      { title: 'Availability Zones (AZs) Details', content: ['AZs are isolated from each other to prevent disasters from spreading.', 'They are connected through low-latency, high-speed fiber-optic links.', 'Designing systems to run across multiple AZs ensures High Availability (HA) and Fault Tolerance.'] },
      { title: 'Edge Locations & CloudFront', content: ['Edge Locations are endpoints used by AWS to cache assets globally.', 'They work in tandem with Amazon CloudFront (CDN) to reduce latency for end-users.', 'They are separated from standard AWS Regions to optimize content delivery speed.'] },
      { title: 'Shared Responsibility Model', content: ['AWS is responsible for "Security of the Cloud" (hardware, hypervisors, physical security).', 'The customer is responsible for "Security in the Cloud" (data encryption, OS configuration, IAM users, firewall settings).', 'Understanding this model is critical for passing AWS Certification exams.'] }
    ]
  },
  {
    id: 'ec2',
    name: 'Amazon EC2',
    points: 50,
    level: 'Beginner',
    description: 'Provision and configure virtual servers (compute instances) in the cloud with custom operating systems.',
    iconName: 'Cpu',
    estimatedTime: '20 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Launch an EC2 instance with Amazon Linux.', 'Configure a security group for web traffic (Port 80).', 'Create and associate an Elastic IP address.', 'SSH into the virtual machine using a PEM key pair.'],
    quiz: {
      question: 'Which firewall mechanism is stateful and operates at the Amazon EC2 instance level to control traffic?',
      options: ['Network ACL (NACL)', 'Security Group', 'Route Table', 'Internet Gateway'],
      answerIndex: 1,
      explanation: 'Security groups are stateful firewalls that control inbound and outbound traffic at the instance level. Network ACLs are stateless and operate at the subnet level.'
    },
    learningContent: [
      { title: 'Introduction to EC2', content: ['Amazon Elastic Compute Cloud (EC2) provides secure, resizable compute capacity in the cloud.', 'It enables you to boot virtual machines, called "instances", running various operating systems (Linux, Windows).', 'You can select from multiple instance types optimized for compute, memory, storage, or graphics.'] },
      { title: 'Instance Types & Purchasing Options', content: ['EC2 Instance Classes: general purpose (T and M), compute optimized (C), memory optimized (R).', 'On-Demand: Pay per second, most flexible, no commitment.', 'Savings Plans / Reserved: Commit to 1 or 3 years for up to 72% discount.', 'Spot Instances: Bid on spare AWS capacity at up to 90% discount, but can be terminated with a 2-minute warning.'] },
      { title: 'Firewall Security: Security Groups', content: ['Security Groups act as virtual firewalls at the instance level.', 'They are stateful: if you allow inbound traffic on port 80, outbound responses are automatically permitted.', 'You can only define ALLOW rules in Security Groups, not DENY rules.'] },
      { title: 'Connecting to EC2', content: ['You connect to Linux instances using SSH (Secure Shell) on Port 22.', 'Windows instances are accessed using RDP (Remote Desktop Protocol) on Port 3389.', 'SSH requires a secure PEM/PPK cryptographic private key pair generated during instance creation.'] }
    ]
  },
  {
    id: 's3',
    name: 'Amazon S3',
    points: 50,
    level: 'Beginner',
    description: 'Store objects (files) securely at massive scale with low latency and high availability.',
    iconName: 'Database',
    estimatedTime: '15 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Create a globally unique S3 bucket.', 'Upload file assets and configure public block access.', 'Enable S3 Bucket Versioning.', 'Set up S3 Lifecycle Policies for automated archiving.'],
    quiz: {
      question: 'You want to automatically transition raw logs to a colder storage class after 30 days and delete them after 90 days. Which S3 feature should you use?',
      options: ['S3 Bucket Policies', 'S3 Lifecycle Rules', 'S3 Cross-Region Replication', 'S3 Object Locking'],
      answerIndex: 1,
      explanation: 'S3 Lifecycle Rules allow you to define transitions of objects between different storage classes (e.g. Standard to Glacier) and set deletion schedules.'
    },
    learningContent: [
      { title: 'Object Storage vs Block Storage', content: ['Amazon Simple Storage Service (S3) is an object storage service, perfect for flat files (images, logs, videos).', 'Unlike block storage (like EC2 hard drives), objects are accessed via unique HTTP keys (URLs).', 'S3 offers 11 nines of durability (99.999999999%), meaning files are replicated across multiple physical facilities.'] },
      { title: 'S3 Storage Classes', content: ['S3 Standard: Active, high-frequency access files.', 'S3 Standard-IA (Infrequent Access): Less active, but needs instant retrieval if requested.', 'S3 Intelligent-Tiering: Automatically transitions files to optimize cost based on access history.', 'S3 Glacier & Glacier Deep Archive: Colder offline backups, retrieval times from minutes to 12 hours.'] },
      { title: 'Security & Bucket Policies', content: ['By default, all S3 buckets are private and block all public access.', 'You can configure S3 Bucket Policies (JSON documents) to grant read/write permissions to users or groups.', 'Access can also be restricted using Identity Access Management (IAM) policies or access control lists (ACLs).'] },
      { title: 'Versioning & Lifecycle Rules', content: ['Versioning stores duplicate copies of objects upon modification or deletion, shielding files from accidents.', 'Lifecycle rules automatically migrate objects between storage tiers (e.g., Standard -> Archive after 30 days) to optimize pricing.'] }
    ]
  },
  {
    id: 'iam',
    name: 'AWS IAM',
    points: 50,
    level: 'Beginner',
    description: 'Manage identities, permissions, and roles to secure access to your AWS environment.',
    iconName: 'ShieldAlert',
    estimatedTime: '15 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Configure MFA for the AWS Root Account.', 'Create IAM Users, Groups, and attach Managed Policies.', 'Understand IAM Roles and write custom JSON policy documents.', 'Attach an IAM Role to an EC2 instance to grant S3 access.'],
    quiz: {
      question: 'What is the best security practice for allowing applications running on EC2 to read from an S3 bucket?',
      options: ['Store static AWS Access Keys inside the code repository.', 'Attach an IAM Role with appropriate S3 read permissions to the EC2 instance.', 'Set the S3 bucket access policy to public read-write for anonymous clients.', 'Use the root account credentials to execute the application code.'],
      answerIndex: 1,
      explanation: 'Attaching an IAM Role to an EC2 instance dynamically provisions temporary credentials, eliminating the risk of hardcoded keys leaking.'
    },
    learningContent: [
      { title: 'Introduction to IAM', content: ['AWS Identity and Access Management (IAM) controls WHO can access WHAT resources in your AWS account.', 'IAM is a global service; it does not operate in individual AWS regions.', 'Key entities include: Root Account, Users, Groups, Policies, and Roles.'] },
      { title: 'Root Account vs IAM Users', content: ['The Root Account is the identity used to create the AWS account, possessing unrestricted permissions.', 'Best practice is to lock the root access keys and use IAM Users or Single Sign-On (SSO) for daily tasks.', 'Always enable Multi-Factor Authentication (MFA) on the root account and administrator accounts.'] },
      { title: 'IAM Groups & Policies', content: ['IAM Groups are collections of users (e.g., Developers, Admins). Permissions are applied directly to the group.', 'IAM Policies are JSON documents that define allowed/denied API actions.', 'Policy Example: "Effect: Allow, Action: s3:GetObject, Resource: arn:aws:s3:::my-bucket/*".'] },
      { title: 'IAM Roles & Temporary Credentials', content: ['An IAM Role is an identity that can be assumed by trusted entities (like EC2 instances or Lambda functions).', 'Roles do not have credentials (passwords or access keys) associated with them.', 'Instead, assuming a role yields temporary, automatically rotating security keys, minimizing credentials leak risk.'] }
    ]
  },
  {
    id: 'vpc',
    name: 'Amazon VPC',
    points: 50,
    level: 'Beginner',
    description: 'Design and deploy custom isolated virtual networks with subnets, gateways, and routing.',
    iconName: 'Network',
    estimatedTime: '25 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Create a custom VPC with a /16 CIDR range.', 'Deploy Public and Private Subnets in multiple AZs.', 'Set up an Internet Gateway (IGW) and Route Tables.', 'Configure a NAT Gateway to allow outbound connectivity for private subnets.'],
    quiz: {
      question: 'Which VPC component translates private IP addresses to a public elastic IP, allowing private subnets to reach the internet without exposing them to incoming connections?',
      options: ['Internet Gateway (IGW)', 'NAT Gateway', 'Virtual Private Gateway (VGW)', 'VPC Peering Connection'],
      answerIndex: 1,
      explanation: 'A NAT Gateway translates traffic from a private subnet to the internet using its own public Elastic IP address, preventing external internet clients from directly initiating connections to private resources.'
    },
    learningContent: [
      { title: 'VPC Architecture Basics', content: ['Amazon Virtual Private Cloud (VPC) lets you provision a logically isolated section of the AWS cloud.', 'You define your own network layout, including IP address ranges (CIDR blocks), subnets, route tables, and gateways.', 'A VPC is bound to a single AWS region, but subnets can span different AZs.'] },
      { title: 'Public vs Private Subnets', content: ['Subnets are segments of IP addresses within a VPC.', 'A Public Subnet has a route table directing traffic to an Internet Gateway (IGW), allowing two-way communication with the web.', 'A Private Subnet has no route to the IGW; its hosts cannot be reached directly from the internet.'] },
      { title: 'Routing & Gateways', content: ['Internet Gateway (IGW): Allows public instances to route to the internet.', 'NAT Gateway: Deployed in a public subnet, it allows private instances outbound-only access for updates, blocking incoming probes.', 'Route Tables: Network tables determining where subnet traffic is forwarded.'] },
      { title: 'Network Firewalls: Security Groups vs NACLs', content: ['Security Groups: Stateful firewalls applied at the EC2 instance level.', 'Network Access Control Lists (NACLs): Stateless firewalls applied at the subnet level. They process inbound and outbound rules separately.'] }
    ]
  },
  {
    id: 'beanstalk',
    name: 'Elastic Beanstalk',
    points: 75,
    level: 'Beginner',
    description: 'Deploy and scale web apps and services written in Java, .NET, PHP, Node.js, Python, Ruby, and Docker on familiar servers.',
    iconName: 'Layers',
    estimatedTime: '15 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Initialize an Elastic Beanstalk web server environment.', 'Configure auto scaling and load balancing parameters.', 'Deploy a version update of a sample application.', 'Monitor environment health using Beanstalk logs.'],
    quiz: {
      question: 'Which AWS service is classified as a Platform-as-a-Service (PaaS) that automates infrastructure provisioning, OS patching, and load scaling for web applications?',
      options: ['Amazon EC2', 'AWS Elastic Beanstalk', 'AWS CloudFormation', 'Amazon Lightsail'],
      answerIndex: 1,
      explanation: 'AWS Elastic Beanstalk is a PaaS. You simply upload your application code, and Beanstalk automatically handles the deployment details, provisioning, load balancing, scaling, and health monitoring.'
    },
    learningContent: [
      { title: 'What is Elastic Beanstalk?', content: ['AWS Elastic Beanstalk is a Platform-as-a-Service (PaaS) designed for quick web app deployment.', 'You upload code, and Beanstalk automatically handles provisioning, load balancing, scaling, and metrics.', 'You retain full control over the underlying EC2 instances if you wish to adjust settings later.'] },
      { title: 'Web Server vs Worker Tier', content: ['Web Server Tier: Handles HTTP requests from clients, running code on EC2 backed by an Application Load Balancer.', 'Worker Tier: Reads messages from an Amazon SQS queue to run asynchronous tasks (like video resizing or database indexing).'] },
      { title: 'Deployment Policies', content: ['All at Once: Replaces code on all servers concurrently. Fastest, but causes downtime.', 'Rolling: Replaces code on a subset of instances at a time. No downtime, but capacity is temporarily reduced.', 'Immutable: Spins up fresh instances with new code. Zero downtime, safest, but takes the longest time.'] },
      { title: 'Configuration Management', content: ['You define software packages, system environment keys, and hooks inside `.ebextensions/` folder configuration files.', 'Beanstalk automatically applies these rules when booting nodes.'] }
    ]
  },

  // Intermediate (5)
  {
    id: 'cloudfront',
    name: 'CloudFront',
    points: 75,
    level: 'Intermediate',
    description: 'Distribute static and dynamic web content globally with low latency using edge cache servers.',
    iconName: 'Share2',
    estimatedTime: '15 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Create a CloudFront distribution pointing to an S3 bucket or ALB.', 'Configure Origin Access Control (OAC) to secure S3 traffic.', 'Understand cache behaviors, TTLs, and cache invalidation.', 'Enable geographic restriction rules on edge nodes.'],
    quiz: {
      question: 'How can you restrict direct access to files in an S3 bucket and force users to go through Amazon CloudFront instead?',
      options: ['By configuring Route 53 DNS records.', 'By setting up S3 Origin Access Control (OAC) and blocking public access on S3.', 'By encrypting the files with KMS.', 'By changing the bucket storage class to Intelligent-Tiering.'],
      answerIndex: 1,
      explanation: 'Using S3 Origin Access Control (OAC) limits bucket access exclusively to CloudFront. All other traffic, including direct anonymous S3 requests, is blocked.'
    },
    learningContent: [
      { title: 'Global Content Delivery Networks', content: ['Amazon CloudFront is a fast content delivery network (CDN) service.', 'It caches data at global Edge Locations, dramatically reducing loading latency for static files.', 'It integrates seamlessly with S3 buckets, EC2 virtual hosts, and API Gateway endpoints.'] },
      { title: 'Origins & Distributions', content: ['An Origin is the source location of the files (e.g. S3 bucket, Elastic Load Balancer).', 'A Distribution is the cached domain name configured to distribute traffic.', 'CloudFront queries the origin on a cache miss, then stores it at the edge for future requests.'] },
      { title: 'Cache Behaviors & TTL', content: ['Time-to-Live (TTL) values control how long files are stored in edge cache before querying the origin.', 'Default TTL is 24 hours. You can clear cache instantly using Cache Invalidations (which may incur charges).'] },
      { title: 'Origin Access Control (OAC)', content: ['OAC allows you to secure S3 bucket contents so they are only accessible through CloudFront.', 'This blocks users from bypassing CDN rules or accessing the source files directly.'] }
    ]
  },
  {
    id: 'rds',
    name: 'RDS',
    points: 75,
    level: 'Intermediate',
    description: 'Provision and scale managed relational databases (MySQL, PostgreSQL, Oracle, SQL Server) with high availability.',
    iconName: 'Server',
    estimatedTime: '20 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Deploy an RDS Multi-AZ database cluster for automatic failover.', 'Configure read replicas to offload heavy read queries.', 'Enable automated database snapshots and point-in-time recovery.', 'Connect an EC2 backend to the database securely.'],
    quiz: {
      question: 'What is the primary benefit of deploying an Amazon RDS database in a Multi-AZ configuration?',
      options: ['It increases read query throughput by load balancing connections.', 'It provides high availability and automatic failover in the event of an outage.', 'It encrypts database rows automatically without overhead.', 'It allows serverless auto-scaling based on CPU loads.'],
      answerIndex: 1,
      explanation: 'Multi-AZ deployments provide high availability, data redundancy, and automated failover by replicating data synchronously to a standby instance in a different Availability Zone.'
    },
    learningContent: [
      { title: 'Managed Relational Databases', content: ['Amazon Relational Database Service (RDS) manages relational database setups (MySQL, PostgreSQL, SQL Server).', 'AWS takes care of OS patching, backups, storage scaling, and hardware provisioning.', 'You retain full control over databases via standard database client tools.'] },
      { title: 'Multi-AZ High Availability', content: ['In a Multi-AZ deployment, AWS replicates data synchronously to a hot standby instance in a different AZ.', 'If the primary database fails, AWS automatically updates DNS records to direct connections to the standby database, minimizing downtime.'] },
      { title: 'Offloading Reads: Read Replicas', content: ['Read Replicas replicate data asynchronously for heavy read workloads.', 'You can spin up multiple read replicas across regions, load balancing read commands to optimize primary database compute resource consumption.'] },
      { title: 'RDS Backups & Restoration', content: ['Automated Backups: Periodic daily storage backups with point-in-time recovery capabilities.', 'Snapshots: User-initiated backups that persist even if the parent RDS DB instance is deleted.'] }
    ]
  },
  {
    id: 'lambda',
    name: 'Lambda',
    points: 75,
    level: 'Intermediate',
    description: 'Execute serverless backend code in response to events (S3 changes, API Gateway calls, DynamoDB streams) without managing servers.',
    iconName: 'Zap',
    estimatedTime: '15 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Write an AWS Lambda handler function in Node.js or Python.', 'Configure trigger events from S3 bucket uploads.', 'Manage execution timeout, concurrency limits, and memory allocation.', 'Access environment secrets and configure IAM execution roles.'],
    quiz: {
      question: 'Which of the following is a key characteristic of AWS Lambda compute structures?',
      options: ['You pay a flat monthly rate regardless of function executions.', 'Functions can execute continuously for up to 24 hours per invocation.', 'It is serverless, and charges are based on the number of requests and execution duration (per millisecond).', 'You must configure the underlying Linux OS packages manually.'],
      answerIndex: 2,
      explanation: 'AWS Lambda is a serverless compute service. You only pay for requests and duration of execution in milliseconds, with no idle server costs.'
    },
    learningContent: [
      { title: 'Introduction to Serverless Compute', content: ['AWS Lambda lets you execute application code without provisioning virtual instances.', 'You only write the code functions; AWS manages the underlying operating system layers.', 'Lambda scales automatically: from zero to thousands of parallel executions instantly.'] },
      { title: 'Event-Driven Executions', content: ['Functions run in response to event triggers, such as database updates, HTTP calls, or file uploads.', 'Lambda supports Python, Node.js, Java, Go, Ruby, and custom runtimes via Docker containers.'] },
      { title: 'Configuration Metrics', content: ['Memory allocation: 128MB to 10GB. Allocating more memory automatically scales CPU power.', 'Execution timeout: Maximum allowed invocation duration is 15 minutes.'] },
      { title: 'Execution IAM Roles', content: ['Lambda requires an Execution Role to interact with other AWS resources.', 'For example, writing logs to CloudWatch or reading objects from S3 requires permissions defined in the Lambda role policy.'] }
    ]
  },
  {
    id: 'autoscaling',
    name: 'Auto Scaling',
    points: 20,
    level: 'Intermediate',
    description: 'Dynamically add or remove EC2 instances to maintain performance and optimize operational costs.',
    iconName: 'GitBranch',
    estimatedTime: '20 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Create an Auto Scaling Launch Template.', 'Set up scaling policies based on metric alarms (e.g. CPU > 70%).', 'Configure target tracking scaling policies.', 'Perform system load testing to verify automated scaling triggers.'],
    quiz: {
      question: 'What is the purpose of a "Launch Template" in Amazon EC2 Auto Scaling?',
      options: ['It specifies the scaling schedule for the instances.', 'It defines the configuration of the EC2 instances to be launched, including AMI, type, and security groups.', 'It sets the maximum and minimum number of instances in the scaling group.', 'It configures the load balancer listener parameters.'],
      answerIndex: 1,
      explanation: 'A Launch Template specifies instance configuration parameters (AMI ID, instance type, key pairs, security groups, block devices, etc.) used by Auto Scaling to launch new instances.'
    },
    learningContent: [
      { title: 'Horizontal Scaling Mechanics', content: ['Auto Scaling Groups (ASGs) dynamically manage EC2 fleets to absorb load fluctuations.', 'Scaling Out: Adding instances during peak traffic hours.', 'Scaling In: Removing instances when load decreases to optimize hosting costs.'] },
      { title: 'Launch Templates', content: ['A Launch Template defines instance configuration parameters (AMI ID, instance type, security groups) used to provision new nodes.'] },
      { title: 'ASG Size Parameters', content: ['Minimum Size: The absolute minimum instances that must run in the group.', 'Maximum Size: The maximum limit to prevent runaway costs.', 'Desired Capacity: The target number of active nodes. Defaults to minimum size.'] },
      { title: 'Scaling Policies', content: ['Target Tracking: Maintain a metric value (e.g. average CPU at 50%).', 'Step Scaling: Add nodes based on CPU threshold bands (e.g., +2 nodes if CPU > 70%).'] }
    ]
  },
  {
    id: 'cloudwatch',
    name: 'CloudWatch',
    points: 75,
    level: 'Intermediate',
    description: 'Monitor cloud resources and applications in real-time, collect metrics, track logs, and set alarms.',
    iconName: 'Eye',
    estimatedTime: '15 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Create custom CloudWatch dashboards to track EC2 CPU metrics.', 'Set up an alarm to send email alerts via SNS when CPU spikes.', 'Collect and search application error logs using CloudWatch Log Groups.', 'Define EventBridge (CloudWatch Events) cron triggers to run Lambda.'],
    quiz: {
      question: 'Which tool would you use to collect system metrics, search and analyze application log files, and configure automated alert triggers based on thresholds?',
      options: ['AWS CloudTrail', 'Amazon CloudWatch', 'AWS Config', 'AWS Systems Manager'],
      answerIndex: 1,
      explanation: 'Amazon CloudWatch is the monitoring and observability service. CloudTrail focuses on API call auditing, and Config tracks configuration changes.'
    },
    learningContent: [
      { title: 'Introduction to CloudWatch', content: ['Amazon CloudWatch provides unified monitoring and observability for AWS resources.', 'It collects metrics (performance data), logs (application events), and trace data.'] },
      { title: 'Metrics & Dashboards', content: ['Metrics are numeric measurements collected periodically (e.g. EC2 CPU load, S3 storage size).', 'You can create unified visual dashboards to monitor multiple services in one view.'] },
      { title: 'Alarms & Actions', content: ['CloudWatch Alarms monitor metric thresholds.', 'Example Action: Trigger a billing alert, auto-terminate idle instances, or send SMS alerts via SNS.'] },
      { title: 'CloudWatch Logs', content: ['Log Groups collect application logs, enabling search, filtering, and metric filters creation (like counting 404 errors).'] }
    ]
  },
  {
    id: 'amazon_aurora_db',
    name: 'Amazon Aurora',
    points: 75,
    level: 'Intermediate',
    description: 'Deploy a high-performance relational database engine compatible with MySQL and PostgreSQL built for the cloud.',
    iconName: 'Database',
    estimatedTime: '20 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Deploy an Amazon Aurora database cluster.', 'Configure Aurora Serverless auto-scaling limits.', 'Understand global database replication and active-active setups.', 'Set up read-replica endpoints for high-throughput scaling.'],
    quiz: {
      question: 'Which Amazon database engine offers MySQL and PostgreSQL compatibility with up to 5x the throughput of standard MySQL?',
      options: ['Amazon RDS MySQL', 'Amazon Aurora', 'Amazon DynamoDB', 'Amazon Redshift'],
      answerIndex: 1,
      explanation: 'Amazon Aurora is a fully-managed, high-performance relational database engine compatible with MySQL and PostgreSQL, designed to deliver up to 5x MySQL throughput.'
    },
    learningContent: [
      { title: 'Introduction to Amazon Aurora', content: ['Amazon Aurora is a cloud-native relational database engine offering high performance and availability.', 'It is compatible with MySQL and PostgreSQL, allowing you to run existing apps without modifications.', 'It features a distributed, fault-tolerant, self-healing storage system that auto-scales up to 128TB.'] },
      { title: 'Aurora High Availability & Storage', content: ['Aurora replicates data six ways across three Availability Zones.', 'It tolerates the loss of up to two copies of data without affecting write availability, and three copies without affecting read availability.'] },
      { title: 'Aurora Serverless', content: ['Aurora Serverless is an on-demand, auto-scaling configuration for Aurora.', 'It automatically starts up, shuts down, and scales capacity up or down based on your application\'s needs, so you only pay for actual database capacity used.'] }
    ]
  },

  // Advanced (6)
  {
    id: 'eks',
    name: 'EKS',
    points: 100,
    level: 'Advanced',
    description: 'Run Kubernetes workloads natively on AWS with fully-managed master control planes.',
    iconName: 'Boxes',
    estimatedTime: '25 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Initialize an Amazon EKS cluster control plane.', 'Deploy containerized nodes using AWS Fargate serverless profiles.', 'Configure kubectl tools to interact with EKS namespaces.', 'Expose containerized pods to the internet via an Application Load Balancer.'],
    quiz: {
      question: 'In Amazon EKS, which tool allows you to deploy container pods without provisioning or managing EC2 worker nodes?',
      options: ['Elastic Beanstalk container profiles', 'AWS Fargate integration', 'Kubernetes NodeGroups', 'Docker Compose plugins'],
      answerIndex: 1,
      explanation: 'AWS Fargate provides serverless container compute for EKS. AWS manages node provisioning, configuration, and scaling, so you only manage Kubernetes pods.'
    },
    learningContent: [
      { title: 'Managed Kubernetes on AWS', content: ['Amazon Elastic Kubernetes Service (EKS) operates Kubernetes clusters on AWS.', 'EKS manages the Kubernetes control plane nodes across multiple availability zones automatically.'] },
      { title: 'EKS Node Types', content: ['Managed Node Groups: AWS provisions and scaling worker EC2 instances for you.', 'AWS Fargate: Serverless compute for containers. Run pods directly without managing virtual machines.'] },
      { title: 'Networking & Security', content: ['EKS supports VPC networking directly using the AWS VPC CNI plugin.'] },
      { title: 'Integration with ALB', content: ['Deploying an AWS Load Balancer Controller exposes pods directly using Application Load Balancers.'] }
    ]
  },
  {
    id: 'terraform',
    name: 'Terraform',
    points: 100,
    level: 'Advanced',
    description: 'Define and provision infrastructure as code (IaC) across multiple cloud providers using declarative configuration files.',
    iconName: 'Code',
    estimatedTime: '20 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Write custom Terraform configuration files (.tf) for standard VPC architectures.', 'Run terraform init, plan, and apply commands.', 'Manage state locking and remote backend configurations using S3 and DynamoDB.', 'Import existing manual infrastructure resources into Terraform state.'],
    quiz: {
      question: 'In Terraform, what file is used to map real-world cloud resources to your configuration, and keep track of metadata?',
      options: ['variables.tf', 'terraform.tfstate', '.terraform.lock.hcl', 'main.tf'],
      answerIndex: 1,
      explanation: 'The `terraform.tfstate` file is the local or remote state file that records the mapping between resources declared in configurations and the actual resources created in AWS.'
    },
    learningContent: [
      { title: 'Infrastructure as Code Philosophy', content: ['IaC enables you to provision, edit, and audit cloud infrastructure using configuration files instead of manual console work.'] },
      { title: 'Declarative Syntax', content: ['Terraform uses HashiCorp Configuration Language (HCL) to declare target infrastructure properties.'] },
      { title: 'The State File (`.tfstate`)', content: ['The state file tracks the current mapping of configurations to deployed resources.', 'Remote Backends: Store state files in S3 and lock them via DynamoDB tables to facilitate team collaboration.'] },
      { title: 'Terraform Command Lifecycle', content: ['`terraform init`: Prepare workspace, download plugins.', '`terraform plan`: Preview changes to apply.', '`terraform apply`: Deploy resources in AWS.'] }
    ]
  },
  {
    id: 'dynamodb',
    name: 'DynamoDB',
    points: 100,
    level: 'Advanced',
    description: 'Configure and scale Amazon DynamoDB, a fully-managed, high-throughput serverless NoSQL database.',
    iconName: 'Database',
    estimatedTime: '20 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Provision a DynamoDB table with a Partition Key and Sort Key.', 'Understand Local and Global Secondary Indexes (LSI/GSI).', 'Optimize database traffic with DynamoDB Accelerator (DAX) caching.', 'Enable DynamoDB streams to trigger event processing on item changes.'],
    quiz: {
      question: 'Which DynamoDB feature would you implement to provide sub-millisecond read access speeds for extremely high-traffic key-value tables?',
      options: ['Global Secondary Indexes (GSI)', 'DynamoDB Accelerator (DAX)', 'DynamoDB Streams', 'Provisioned Capacity auto-scaling'],
      answerIndex: 1,
      explanation: 'DynamoDB Accelerator (DAX) is a fully-managed, highly available, in-memory cache for DynamoDB that reduces read response times from milliseconds to microseconds.'
    },
    learningContent: [
      { title: 'Managed NoSQL Databases', content: ['Amazon DynamoDB is a key-value and document database that delivers single-digit millisecond performance at scale.'] },
      { title: 'Primary Keys', content: ['Partition Key (PK): Determines the physical partition of data.', 'Sort Key (SK): Orders records within a partition. combined, they form a composite primary key.'] },
      { title: 'Secondary Indexes', content: ['Local Secondary Index (LSI): Uses the same PK but a different SK.', 'Global Secondary Index (GSI): Uses a completely different PK and SK.'] },
      { title: 'DynamoDB Streams', content: ['Streams capture database mutations, enabling real-time actions via AWS Lambda triggers.'] }
    ]
  },
  {
    id: 'sns_sqs',
    name: 'SNS & SQS',
    points: 100,
    level: 'Advanced',
    description: 'Decouple server applications and distribute events asynchronously using managed message queues and notification topics.',
    iconName: 'Mail',
    estimatedTime: '15 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Create an Amazon SQS standard queue and FIFO queue.', 'Publish pub/sub messages using Amazon SNS topics.', 'Set up SQS as a subscription endpoint to an SNS topic (fan-out pattern).', 'Configure dead-letter queues (DLQs) to handle failed message retries.'],
    quiz: {
      question: 'Which integration pattern allows you to duplicate a single message published to a topic across multiple distinct queues for parallel processing?',
      options: ['SQS Polling client routing', 'SNS to SQS Fan-out pattern', 'Direct VPC Peering loops', 'DynamoDB stream caching'],
      answerIndex: 1,
      explanation: 'The fan-out pattern involves publishing a message to an SNS topic, which automatically replicates and pushes that message to multiple subscribed SQS queues for parallel processing.'
    },
    learningContent: [
      { title: 'Decoupling Cloud Architecture', content: ['SQS and SNS are messaging services that separate components, preventing network cascading failures.'] },
      { title: 'Amazon SQS (Queues)', content: ['Simple Queue Service is a message storage queue.', 'Standard: Infinite scale, at-least-once delivery, out-of-order execution.', 'FIFO (First-In-First-Out): Strict order, exactly-once delivery. Limit: 3000 messages/sec.'] },
      { title: 'Amazon SNS (Notifications)', content: ['Simple Notification Service is a pub/sub event publisher routing messages to subscribers (SMS, SQS, HTTP endpoints).'] },
      { title: 'Fan-Out Pattern', content: ['Publishing events to an SNS topic that forwards copies to multiple SQS queues simultaneously.'] }
    ]
  },
  {
    id: 'step_functions',
    name: 'Step Functions',
    points: 100,
    level: 'Advanced',
    description: 'Coordinate distributed serverless services and model business workflows as visual state machines.',
    iconName: 'PlaySquare',
    estimatedTime: '20 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Define a visual state machine workflow using Amazon States Language (ASL).', 'Incorporate sequential, parallel, and choice execution branches.', 'Establish automated retries and catch blocks for step failures.', 'Integrate Step Functions with Lambda execution steps.'],
    quiz: {
      question: 'Which AWS service allows you to coordinate multiple Lambda functions and other services into visual state machines and track execution steps?',
      options: ['AWS Systems Manager', 'AWS Step Functions', 'AWS CloudFormation', 'AWS OpsWorks'],
      answerIndex: 1,
      explanation: 'AWS Step Functions is a visual workflow orchestrator that lets you build, manage, and execute complex state machines combining multiple AWS services.'
    },
    learningContent: [
      { title: 'Orchestrating Serverless Services', content: ['AWS Step Functions coordinates multiple services into automated serverless workflows.'] },
      { title: 'State Machines & ASL', content: ['Workflows are modeled as state machines written in Amazon States Language (ASL), a JSON format.'] },
      { title: 'Step Types', content: ['Task: Run a job (e.g. call Lambda).', 'Choice: Evaluate inputs to branch path.', 'Parallel: Execute tasks concurrently.'] },
      { title: 'Failure Management', content: ['Step Functions provides built-in error catching and retry rules, tracking failure states.'] }
    ]
  },
  {
    id: 'cloudformation',
    name: 'CloudFormation',
    points: 100,
    level: 'Advanced',
    description: 'Define and deploy full AWS cloud infrastructure stacks in a single, safe, repeatable template using JSON or YAML.',
    iconName: 'Box',
    estimatedTime: '20 Minutes',
    learningPagesCount: 4,
    quizQuestionsCount: 3,
    tasks: ['Write a YAML CloudFormation template declaring an EC2 and Security Group.', 'Launch a cloud infrastructure stack in the AWS Management Console.', 'Define stack input parameters, outputs, and cross-stack references.', 'Configure stack rollback behaviors on resource deployment failures.'],
    quiz: {
      question: 'In AWS CloudFormation, what component resolves resource configuration mismatches by identifying changes made to stack resources outside of CloudFormation management?',
      options: ['Stack Policy blocks', 'Drift Detection', 'Rollback Triggers', 'Change Sets'],
      answerIndex: 1,
      explanation: 'Drift Detection allows you to identify stack resources that have been modified or deleted outside of CloudFormation management, ensuring configuration parity.'
    },
    learningContent: [
      { title: 'CloudFormation Basics', content: ['AWS CloudFormation is the native IaC solution for AWS, deploying groups of resources as a "Stack".'] },
      { title: 'Templates Structure', content: ['JSON or YAML declarations containing Parameters, Resources, and Outputs.'] },
      { title: 'Change Sets', content: ['Change Sets preview stack changes prior to deployment, preventing accidents.'] },
      { title: 'Drift Detection', content: ['Drift checks verify stack parity, noting modifications made to active systems manually.'] }
    ]
  }
];

const compileRoadmapModules = (): ModuleData[] => {
  const list: ModuleData[] = [];
  
  const beginnerDetails = staticModules.filter(m => m.level === 'Beginner');
  const intermediateDetails = staticModules.filter(m => m.level === 'Intermediate');
  const advancedDetails = staticModules.filter(m => m.level === 'Advanced');

  list.push(...beginnerDetails);
  list.push(...intermediateDetails);
  list.push(...advancedDetails);

  return list;
};

export const ROADMAP_MODULES = compileRoadmapModules();

export const MOCK_ACHIEVEMENTS = [
  {
    id: 'badge1',
    name: 'Early Bird',
    description: 'Logged in and started the path early',
    icon: 'Sparkles',
    unlocked: true,
    date: 'Jun 3, 2026',
    color: 'from-amber-400 to-orange-500'
  },
  {
    id: 'badge2',
    name: 'Week Streak',
    description: 'Maintained a 7-day learning streak',
    icon: 'Flame',
    unlocked: true,
    date: 'Today',
    color: 'from-orange-500 to-rose-600'
  },
  {
    id: 'badge3',
    name: 'Quiz Master',
    description: 'Completed 5 quizzes with zero failures',
    icon: 'Award',
    unlocked: false,
    date: 'Locked',
    color: 'from-blue-400 to-indigo-500'
  },
  {
    id: 'badge4',
    name: 'Explorer',
    description: 'Unlocked all Beginner modules',
    icon: 'Compass',
    unlocked: false,
    date: 'Locked',
    color: 'from-emerald-400 to-teal-500'
  }
];
