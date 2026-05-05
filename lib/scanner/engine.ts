import { resolve4, resolveMx, resolveTxt, resolveNs, resolveSoa, resolveCname } from 'dns/promises';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { URL } from 'url';
import type { DiscoveredAsset, CloudAsset, ScanResult, Finding, WebVuln, SSLInfo, DNSRecord } from './types';

const SUBDOMAIN_WORDLIST = [
  'www','mail','ftp','localhost','webmail','smtp','pop','ns1','webdisk','ns2','cpanel','whm',
  'autodiscover','autoconfig','ns3','m','imap','test','ns','blog','pop3','dev','www2','admin',
  'forum','news','vpn','ns4','www1','irc','backup','mx','email','apps','shop','api','staging',
  'pay','svn','cp','cdn','crm','mx1','mx2','forums','portal','video','sip','dns2','api1',
  'dns1','www3','dns','mail1','www4','mysql','mail2','support','mx3','wiki','web2','ns5',
  'access','mail3','dns3','demo','smtp2','web1','ssl','ns6','awstats','git','www5','email2',
  'upload','login','en','mx4','mail4','stats','web3','gitlab','monitor','member','cms','data',
  'mx5','docs','vpn2','secure','dashboard','preview','old','beta','mobile','remote','mdm',
  'cloud','files','ldap','exchange','chat','home','app','confluence','jira','gitlab','grafana',
  'prometheus','jenkins','nexus','registry','docker','k8s','kube','kubernetes','rancher',
  'consul','vault','nomad','traefik','nginx','haproxy','varnish','redis','postgres','mysql',
  'mongo','elasticsearch','kafka','rabbitmq','zookeeper','cassandra','couchdb','neo4j',
  'influxdb','prometheus','thanos','loki','jaeger','zipkin','sentry','elastic','kibana',
  'logstash','filebeat','metricbeat','packetbeat','heartbeat','auditbeat','apm',
  'newrelic','datadog','splunk','grafana','zabbix','nagios','icinga','prometheus','thanos',
];

function genId(): string { return Math.random().toString(36).substring(2, 14); }

// ─── Top 1000 Ports ────────────────────────────────────────────────────────
const TOP_PORTS = [
  80,443,21,22,25,53,110,143,3306,3389,5900,8080,8443,21,23,25,53,69,80,110,111,135,139,143,
  161,179,264,389,443,445,500,514,515,520,546,547,587,593,636,843,902,989,990,993,995,1080,
  1194,1241,1311,1433,1434,1521,1701,1723,1812,1813,1883,1900,2049,2100,2103,2105,2107,2195,
  2196,2375,2376,3128,3260,3268,3269,3306,3389,3478,3544,3632,4369,4786,5000,5001,5060,5222,
  5432,5500,5672,5900,5938,5984,5985,6000,6001,6379,6443,6666,6667,7001,7002,7210,7474,7547,
  8000,8008,8009,8010,8069,8080,8081,8086,8087,8088,8089,8090,8091,8112,8123,8139,8140,8161,
  8181,8194,8333,8443,8834,8880,8888,9000,9001,9042,9051,9080,9090,9092,9100,9151,9160,9200,
  9300,9418,9419,9595,9600,9943,9944,9981,10000,10050,10162,10809,11211,11371,12000,12345,
  13364,13579,13720,13721,13724,13782,13783,15672,16010,16030,16992,16993,17000,17170,18091,
  18092,19226,19638,20000,20547,21025,23023,23424,25105,25565,27017,27018,27019,28015,28017,
  28777,28778,29999,3000,3001,3128,3269,33060,3310,3333,3351,3404,3478,3500,3535,3551,3600,
  3632,3689,3690,3724,3780,3784,4000,4001,4040,4044,4080,4100,4111,4125,4200,4242,4243,4322,
  4333,4443,4444,4567,4711,4712,4782,4848,4849,4899,4990,5000,5001,5002,5003,5004,5005,5006,
  5007,5008,5009,5037,5038,5044,5050,5051,5054,5060,5061,5093,5094,5104,5108,5145,5150,5168,
  5190,5198,5222,5223,5269,5280,5298,5351,5353,5355,5357,5432,5466,5500,5550,5554,5555,5560,
  5566,5601,5631,5632,5666,5672,5678,5679,5718,5800,5810,5900,5901,5902,5903,5904,5905,5906,
  5907,5908,5909,5910,5911,5915,5922,5924,5938,5984,5985,5986,6000,6001,6002,6003,6004,6005,
  6006,6007,6008,6009,6010,6011,6017,6052,6100,6101,6106,6112,6123,6129,6156,6343,6344,6346,
  6379,6380,6405,6410,6502,6503,6504,6543,6544,6547,6565,6566,6567,6580,6646,6666,6667,6668,
  6669,6689,6692,6697,6699,6779,6788,6789,6792,6839,6881,6901,6969,7000,7001,7002,7003,7004,
  7005,7006,7007,7008,7009,7010,7011,7019,7021,7023,7025,7070,7100,7103,7106,7200,7201,7402,
  7435,7443,7496,7512,7625,7626,7627,7676,7741,7777,7778,7779,7780,7781,7787,7788,7789,7790,
  7791,7794,7800,7801,7802,7831,7869,7878,7879,7880,7902,7911,7920,7921,7937,7938,7998,7999,
  8000,8001,8002,8007,8008,8009,8010,8011,8021,8022,8031,8042,8045,8080,8081,8082,8083,8084,
  8085,8086,8087,8088,8089,8090,8091,8092,8093,8094,8095,8096,8097,8098,8099,8100,8110,8111,
  8118,8123,8130,8131,8139,8140,8161,8181,8192,8193,8194,8200,8222,8254,8290,8291,8292,8300,
  8333,8383,8400,8402,8443,8500,8600,8649,8651,8652,8654,8701,8800,8873,8880,8888,8899,8994,
  9000,9001,9002,9003,9009,9010,9011,9040,9050,9071,9080,9081,9090,9091,9092,9099,9100,9101,
  9102,9103,9110,9111,9200,9207,9220,9290,9415,9418,9485,9500,9502,9503,9535,9575,9593,9594,
  9595,9618,9666,9876,9877,9878,9898,9900,9917,9929,9943,9944,9968,9998,9999,10000,10001,
  10002,10003,10004,10009,10010,10012,10024,10025,10082,10180,10215,10243,10566,10616,10617,
  10621,10626,10628,10629,10778,11110,11111,11967,12000,12174,12265,12345,13456,13722,13782,
  13783,14000,14238,14441,14442,15000,15002,15003,15004,15660,15742,16000,16001,16010,16012,
  16016,16018,16080,16113,16992,16993,17877,17988,18017,18040,18101,18988,19101,19283,19315,
  19350,19780,19801,19842,20000,20005,20031,20221,20222,20828,21571,22939,23502,24444,24800,
  25734,25735,26214,27000,27017,27018,27019,27352,27353,27355,27356,27715,28201,30000,30718,
  30951,31038,31337,32768,32769,32770,32771,32772,32773,32774,32775,32776,32777,32778,32779,
  32780,32781,32782,32783,32784,32785,32786,32787,32788,32789,32790,32791,32792,32793,32794,
  32795,32796,32797,32798,32799,32803,33060,33269,33270,33272,33333,33434,33670,33899,34571,
  34572,34573,35500,38292,40193,40911,41511,42510,44176,44442,44443,44501,45100,48080,49152,
  49153,49154,49155,49156,49157,49158,49159,49160,49161,49163,49165,49167,49175,49176,49400,
  49999,50000,50001,50002,50003,50006,50300,50389,50500,50636,50800,51103,51493,52673,52822,
  52848,52869,54045,54328,55055,55056,55555,55600,56737,56738,57294,57797,58080,60020,60443,
  61532,61900,62078,63331,64623,64680,65000,65129,65389,
];

const SERVICE_NAMES: Record<number, string> = {
  21:'FTP',
  22:'SSH',
  23:'Telnet',
  25:'SMTP',
  53:'DNS',
  80:'HTTP',
  110:'POP3',
  111:'RPCbind',
  135:'MSRPC',
  139:'NetBIOS',
  143:'IMAP',
  161:'SNMP',
  179:'BGP',
  389:'LDAP',
  443:'HTTPS',
  445:'SMB',
  500:'ISAKMP',
  514:'Shell',
  515:'Printer',
  520:'RIP',
  587:'SMTP-SSL',
  636:'LDAPS',
  843:'Adobe Flash',
  902:'VMware',
  989:'FTPS',
  990:'FTPS',
  993:'IMAPS',
  995:'POP3S',
  1080:'SOCKS',
  1194:'OpenVPN',
  1433:'MSSQL',
  1434:'MSSQL-Browser',
  1521:'Oracle',
  1701:'L2TP',
  1723:'PPTP',
  1883:'MQTT',
  1900:'UPnP',
  2049:'NFS',
  2375:'Docker',
  2376:'Docker-SSL',
  3000:'Miralix',
  3001:'Redwood',
  3128:'Squid',
  3269:'GlobalCatLDAP',
  3306:'MySQL',
  3310:'Dynamo',
  3389:'RDP',
  3404:'Aurora',
  3478:'STUN',
  3500:'Rtmp',
  3535:'MS-Licensing',
  3551:'APCUPSD',
  3632:'Distcc',
  3724:'Blizzard',
  3780:'BMI',
  3784:'VoIPGateway',
  4000:'RX',
  4001:'RX',
  4040:'Cyclone',
  4100:'WatchGuard',
  4111:'Xgrid',
  4125:'Microsoft',
  4200:'VRML',
  4242:'VRML',
  4243:'VRML',
  4322:'VRML',
  4333:'mSQL',
  4369:'EPMD',
  4443:'Pharos',
  4444:'NV-Video',
  4567:'FileMaker',
  4711:'eBuilder',
  4782:'Acronis',
  4786:'Cisco Smart',
  4848:'AppServer',
  4849:'AppServer',
  4899:'Radmin',
  4990:'UPS',
  5000:'UPnP',
  5001:'SSL',
  5002:'Radio',
  5003:'FileMaker',
  5004:'AVT',
  5005:'AVT',
  5006:'WMS',
  5007:'WMS',
  5008:'WMS',
  5009:'Airport',
  5037:'ADB',
  5038:'Couchbase',
  5044:'Logstash',
  5050:'MMCC',
  5051:'ITA',
  5054:'RLM',
  5060:'SIP',
  5061:'SIP-SSL',
  5093:'SentLM',
  5094:'SentLM',
  5104:'Fusion',
  5108:'VPMS',
  5145:'Rmonitor',
  5150:'ATMP',
  5168:'IEC',
  5190:'AOL',
  5198:'AIM',
  5222:'XMPP',
  5223:'XMPP-SSL',
  5269:'XMPP',
  5280:'XMPP',
  5298:'XMPP',
  5351:'NAT-PMP',
  5353:'mDNS',
  5355:'LLMNR',
  5357:'WSD',
  5432:'PostgreSQL',
  5466:'MSQL',
  5500:'VNC',
  5550:'Hotline',
  5554:'Sasser',
  5555:'HP-Data',
  5560:'IS2000',
  5566:'IS2000',
  5601:'RBT-Server',
  5631:'PCAnywhere',
  5632:'PCAnywhere',
  5666:'NRPE',
  5672:'AMQP',
  5678:'MikroTik',
  5679:'Activesync',
  5718:'DPM',
  5800:'VNC',
  5810:'VNC',
  5900:'VNC',
  5901:'VNC',
  5902:'VNC',
  5903:'VNC',
  5904:'VNC',
  5905:'VNC',
  5906:'VNC',
  5907:'VNC',
  5908:'VNC',
  5909:'VNC',
  5910:'VNC',
  5911:'VNC',
  5915:'VNC',
  5922:'VNC',
  5924:'VNC',
  5938:'TeamViewer',
  5984:'CouchDB',
  5985:'WinRM-HTTP',
  5986:'WinRM-HTTPS',
  6000:'X11',
  6001:'X11',
  6002:'X11',
  6003:'X11',
  6004:'X11',
  6005:'X11',
  6006:'X11',
  6007:'X11',
  6008:'X11',
  6009:'X11',
  6010:'X11',
  6011:'X11',
  6017:'X11',
  6052:'X11',
  6100:'Sonus',
  6101:'Backdoor',
  6106:'ISDN',
  6112:'dtspcd',
  6123:'BackupExec',
  6129:'DameWare',
  6156:'ARINC',
  6343:'SFlow',
  6344:'SFlow',
  6346:'Gnutella',
  6379:'Redis',
  6380:'Redis',
  6405:'Boe',
  6410:'Boe',
  6443:'Kubernetes',
  6502:'Netop',
  6503:'Netop',
  6504:'Netop',
  6543:'MythTV',
  6544:'MythTV',
  6547:'PowerChute',
  6565:'SANE',
  6566:'SANE',
  6567:'SANE',
  6580:'Parsec',
  6646:'DRDC',
  6666:'IRCD',
  6667:'IRC',
  6668:'IRCD',
  6669:'IRCD',
  6689:'Telnet',
  6692:'IRC-SSL',
  6697:'IRC-SSL',
  6699:'IRC-SSL',
  6779:'IRC-SSL',
  6788:'IRC-SSL',
  6789:'IRC-SSL',
  6792:'IRC-SSL',
  6839:'IRC-SSL',
  6881:'BitTorrent',
  6901:'BitTorrent',
  6969:'ACMS',
  7001:'WebLogic',
  7002:'WebLogic',
  7003:'WebLogic',
  7004:'WebLogic',
  7005:'WebLogic',
  7006:'WebLogic',
  7007:'WebLogic',
  7008:'WebLogic',
  7009:'WebLogic',
  7010:'WebLogic',
  7011:'WebLogic',
  7019:'WebLogic',
  7021:'WebLogic',
  7023:'WebLogic',
  7025:'WebLogic',
  7070:'RealServer',
  7100:'Font-Service',
  7103:'Font-Service',
  7106:'Font-Service',
  7200:'FODMS',
  7201:'FODMS',
  7402:'RTPS',
  7435:'DDOS',
  7474:'Neo4j',
  7496:'RTPS',
  7512:'RTPS',
  7547:'TR-069',
  7625:'SMMP',
  7626:'SMMP',
  7627:'SMMP',
  7676:'ImqBrokerd',
  7741:'ScriptView',
  7777:'CBT',
  7778:'CBT',
  7779:'CBT',
  7780:'CBT',
  7781:'CBT',
  7787:'CBT',
  7788:'CBT',
  7789:'CBT',
  7790:'CBT',
  7791:'CBT',
  7794:'CBT',
  7800:'ASR',
  7801:'ASR',
  7802:'ASR',
  7831:'Rugrat',
  7869:'Mobile',
  7878:'Mobile',
  7879:'Mobile',
  7880:'Mobile',
  7902:'Mobile',
  7911:'Mobile',
  7920:'Mobile',
  7921:'Mobile',
  7937:'NSRMP',
  7938:'NSRMP',
  7998:'IRTP',
  7999:'IRTP',
  8000:'HTTP-Alt',
  8001:'VCOM',
  8002:'Teradata',
  8007:'Ajile',
  8008:'HTTP',
  8009:'AJP',
  8010:'LogiCAD',
  8011:'LogiCAD',
  8021:'Z-Wave',
  8022:'OA',
  8031:'ProEd',
  8042:'FSP',
  8045:'Daytime',
  8080:'HTTP-Proxy',
  8081:'HTTP-Alt',
  8082:'HTTP-Alt',
  8083:'HTTP-Alt',
  8084:'HTTP-Alt',
  8085:'HTTP-Alt',
  8086:'InfluxDB',
  8087:'InfluxDB',
  8088:'Splunk',
  8089:'Splunk',
  8090:'HTTP-Alt',
  8091:'Couchbase',
  8092:'Couchbase',
  8093:'Couchbase',
  8094:'Couchbase',
  8095:'Couchbase',
  8096:'Couchbase',
  8097:'Couchbase',
  8098:'Couchbase',
  8099:'Couchbase',
  8100:'Xprint',
  8110:'Claris',
  8111:'Claris',
  8112:'Deluge',
  8118:'Privoxy',
  8123:'Polipo',
  8130:'IND',
  8131:'IND',
  8139:'Puppet',
  8140:'Puppet',
  8161:'ActiveMQ',
  8181:'HTTP-Alt',
  8192:'SARAD',
  8193:'SARAD',
  8194:'SARAD',
  8200:'Trivnet',
  8222:'VMware',
  8254:'VMware',
  8290:'Bloomberg',
  8291:'Bloomberg',
  8292:'Bloomberg',
  8300:'Transmitter',
  8333:'Bitcoin',
  8383:'M2M',
  8400:'CVD',
  8402:'Abars',
  8443:'HTTPS-Alt',
  8500:'Hotline',
  8600:'Asterisk',
  8649:'Ganglia',
  8651:'Sun-MSG',
  8652:'Sun-MSG',
  8654:'Sun-MSG',
  8701:'SoftSec',
  8800:'Sun-Web',
  8834:'Nessus',
  8873:'DXSP',
  8880:'HTTP-Alt',
  8888:'HTTP-Alt',
  8899:'OSCAR',
  8994:'RSH-SP',
  9000:'SonarQube',
  9001:'Tor',
  9002:'DynamID',
  9003:'DynamID',
  9009:'Pichat',
  9010:'Pichat',
  9011:'DStar',
  9040:'Tor-Trans',
  9042:'Cassandra',
  9050:'Tor-Socks',
  9051:'Tor',
  9071:'VMware',
  9080:'WebSphere',
  9081:'WebSphere',
  9090:'WebSM',
  9091:'xmltec',
  9092:'Kafka',
  9099:'Statusd',
  9100:'JetDirect',
  9101:'Bacula',
  9102:'Bacula',
  9103:'Bacula',
  9110:'Winix',
  9111:'Cisco',
  9151:'Tor',
  9160:'Cassandra',
  9200:'Elasticsearch',
  9207:'WAP',
  9220:'WAP',
  9290:'HostView',
  9300:'Elasticsearch',
  9415:'Boru',
  9418:'Git',
  9419:'Git',
  9485:'Cumulus',
  9500:'ISMServer',
  9502:'Minicode',
  9503:'Minicode',
  9535:'Man',
  9575:'Man',
  9593:'Man',
  9594:'Man',
  9595:'XDMCP',
  9618:'Campbell',
  9666:'Zoom',
  9876:'Session',
  9877:'Session',
  9878:'Session',
  9898:'MonkeyCom',
  9900:'IMAP',
  9917:'Telnet',
  9929:'NpTp',
  9943:'IMAP',
  9944:'IMAP',
  9968:'IMAP',
  9998:'IMAP',
  9999:'IMAP',
  10000:'Webmin',
  10050:'Zabbix',
  11211:'Memcached',
  12345:'NetBus',
  13364:'Oracle',
  13720:'NetBackup',
  13721:'NetBackup',
  13724:'NetBackup',
  13782:'NetBackup',
  13783:'NetBackup',
  15672:'RabbitMQ',
  16010:'HBase',
  16030:'HBase',
  16992:'Intel AMT',
  16993:'Intel AMT-SSL',
  18091:'Couchbase',
  18092:'Couchbase-SSL',
  19226:'AdminStudio',
  19638:'Ensim',
  20000:'DNP',
  20547:'ProDAQ',
  21025:'Starbound',
  23023:'TianShan',
  23424:'TrackMania',
  25105:'D-Thought',
  25565:'Minecraft',
  27017:'MongoDB',
  27018:'MongoDB',
  27019:'MongoDB',
  28015:'RethinkDB',
  28017:'RethinkDB',
  28777:'DXMP',
  28778:'DXMP',
  29999:'OMX',
  33060:'MySQL-X'
};;

const CVE_DATABASE: Record<string, Record<string, string[]>> = {
  apache: {
    '2.4.49': ['CVE-2021-41773','CVE-2021-42013'],
    '2.4.50': ['CVE-2021-42013'],
    '2.4.41': ['CVE-2020-1927','CVE-2020-1934'],
    '2.4.37': ['CVE-2019-0211'],
    '2.4.29': ['CVE-2018-1312','CVE-2018-1283'],
  },
  nginx: {
    '1.18.0': ['CVE-2021-23017'],
    '1.16.1': ['CVE-2019-9511','CVE-2019-9513'],
    '1.14.0': ['CVE-2018-16843','CVE-2018-16844'],
    '1.12.0': ['CVE-2017-7529'],
  },
  openssh: {
    '8.2': ['CVE-2020-15778'],
    '8.0': ['CVE-2019-16905'],
    '7.7': ['CVE-2018-15473'],
    '7.4': ['CVE-2016-10009'],
  },
  mysql: {
    '5.7.0': ['CVE-2020-14812'],
    '5.6.0': ['CVE-2016-6662'],
    '5.5.0': ['CVE-2012-2122'],
  },
  postgresql: {
    '9.6': ['CVE-2018-16850'],
    '10.0': ['CVE-2019-10164'],
  },
  redis: {
    '5.0.0': ['CVE-2021-32761'],
    '4.0.0': ['CVE-2018-11219'],
    '3.2.0': ['CVE-2016-8339'],
  },
  php: {
    '7.4.0': ['CVE-2019-11043'],
    '7.3.0': ['CVE-2019-13224'],
    '7.2.0': ['CVE-2018-19518'],
    '7.1.0': ['CVE-2017-11143'],
  },
  wordpress: {
    '5.7.0': ['CVE-2021-29447'],
    '5.6.0': ['CVE-2021-29447'],
    '5.5.0': ['CVE-2020-28040'],
  },
  jenkins: {
    '2.0': ['CVE-2024-23897'],
    '2.150': ['CVE-2019-1003000'],
  },
  tomcat: {
    '9.0': ['CVE-2020-1938'],
    '8.5': ['CVE-2019-0232'],
    '7.0': ['CVE-2016-8735'],
  },
  nodejs: {
    '14.0': ['CVE-2021-22940'],
    '12.0': ['CVE-2020-8251'],
    '10.0': ['CVE-2019-15606'],
  },
  django: {
    '3.1': ['CVE-2021-31542'],
    '2.2': ['CVE-2019-19844'],
  },
  laravel: {
    '8.0': ['CVE-2021-3129'],
    '7.0': ['CVE-2020-15270'],
  },
  iis: {
    '10.0.19041': ['CVE-2021-31166'],
    '10.0.19042': ['CVE-2021-31166'],
  },
  python: {
    '3.8': ['CVE-2021-3177'],
    '3.7': ['CVE-2019-9636'],
    '3.6': ['CVE-2018-1060'],
  },
  docker: {
    '20.10': ['CVE-2021-21285'],
    '19.03': ['CVE-2019-5736'],
  },
  kubernetes: {
    '1.20': ['CVE-2020-8554'],
    '1.19': ['CVE-2020-8558'],
  },
  elasticsearch: {
    '7.10': ['CVE-2021-22147'],
    '7.6': ['CVE-2020-7019'],
  },
  mongodb: {
    '4.4': ['CVE-2021-20330'],
    '4.2': ['CVE-2020-7923'],
  },
  rabbitmq: {
    '3.8': ['CVE-2021-22116'],
    '3.7': ['CVE-2019-11358'],
  },
  grafana: {
    '8.0': ['CVE-2021-43798'],
    '7.0': ['CVE-2020-13379'],
  },
  jira: {
    '8.0': ['CVE-2019-11581'],
    '7.0': ['CVE-2017-9506'],
  },
  confluence: {
    '7.0': ['CVE-2021-26084'],
    '6.0': ['CVE-2019-3396'],
  },
};

// ─── Tech Patterns ─────────────────────────────────────────────────────────
const TECH_PATTERNS: [RegExp, string, string?][] = [
  [/Server:\s*nginx[\/\s]*(\d+\.\d+\.?\d*)/i, 'nginx', '1'],
  [/Server:\s*Apache[\/\s]*(\d+\.\d+\.?\d*)/i, 'Apache', '1'],
  [/Server:\s*Microsoft-IIS[\/\s]*(\d+\.\d+)/i, 'IIS', '1'],
  [/X-Powered-By:\s*PHP[\/\s]*(\d+\.\d+\.?\d*)/i, 'PHP', '1'],
  [/X-AspNet-Version:\s*(\d+\.\d+\.\d+)/i, 'ASP.NET', '1'],
  [/X-Generator:\s*WordPress/i, 'WordPress', ''],
  [/X-Jenkins:\s*([\d.]+)/i, 'Jenkins', '1'],
  [/Server:\s*gunicorn[\/\s]*(\d+\.\d+)/i, 'Gunicorn', '1'],
  [/Server:\s*Cowboy/i, 'Cowboy', ''],
  [/Server:\s*Caddy/i, 'Caddy', ''],
  [/X-Drupal-Cache/i, 'Drupal', ''],
  [/X-Pingback:\s*xmlrpc/i, 'WordPress', ''],
  [/X-Shopify-Stage/i, 'Shopify', ''],
  [/X-Cache:\s*HIT/i, 'Varnish', ''],
  [/X-Served-By:\s*cache/i, 'Fastly', ''],
  [/Via:\s*1\.1\s*vegur/i, 'Heroku', ''],
  [/Server:\s*lighttpd[\/\s]*(\d+\.\d+\.?\d*)/i, 'lighttpd', '1'],
  [/Server:\s*LiteSpeed/i, 'LiteSpeed', ''],
  [/Server:\s*openresty/i, 'OpenResty', ''],
  [/Server:\s*Tomcat[\/\s]*(\d+\.\d+)/i, 'Tomcat', '1'],
  [/Server:\s*LiteSpeed[\/\s]*(\d+\.\d+\.?\d*)/i, 'LiteSpeed', '1'],
  [/X-Powered-By:\s*PHP[\/\s]*(\d+\.\d+\.?\d*)/i, 'PHP', '1'],
  [/Server:\s*Litespeed/i, 'LiteSpeed', ''],
  [/X-Powered-By:\s*Express/i, 'Express', ''],
  [/X-Powered-By:\s*Next\.js/i, 'Next.js', ''],
  [/X-Powered-By:\s*Django/i, 'Django', ''],
  [/X-Powered-By:\s*ASP\.NET/i, 'ASP.NET', ''],
  [/X-Runtime:\s*Rails/i, 'Ruby on Rails', ''],
  [/Server:\s*Apache-Coyote/i, 'Apache Tomcat', ''],
  [/X-AspNetMvc-Version:\s*(\d+\.\d+)/i, 'ASP.NET MVC', '1'],
  [/Server:\s*Jetty[\/\s]*(\d+\.\d+)/i, 'Jetty', '1'],
  [/Server:\s*GlassFish/i, 'GlassFish', ''],
  [/Server:\s*WildFly/i, 'WildFly', ''],
  [/X-Powered-By:\s*PleskLin/i, 'Plesk', ''],
  [/X-Powered-By:\s*CPanel/i, 'cPanel', ''],
  [/Server:\s*BigIP/i, 'F5 BIG-IP', ''],
  [/Server:\s*Barracuda/i, 'Barracuda', ''],
  [/X-WAF-Event:/i, 'Generic WAF', ''],
  [/Server:\s*HAProxy/i, 'HAProxy', ''],
  [/Server:\s*Traefik/i, 'Traefik', ''],
  [/Server:\s*Kong/i, 'Kong', ''],
  [/Server:\s*Envoy/i, 'Envoy', ''],
  [/X-Kubernetes-PF:/i, 'Kubernetes', ''],
  [/Server:\s*istio-envoy/i, 'Istio', ''],
  [/Server:\s*Warp[\/\s]*(\d+\.\d+)/i, 'Warp', '1'],
  [/X-Engine:\s*Next.js/i, 'Next.js', ''],
  [/X-Engine:\s*Nuxt/i, 'Nuxt.js', ''],
  [/X-Generator:\s*Joomla/i, 'Joomla', ''],
  [/X-Generator:\s*MediaWiki/i, 'MediaWiki', ''],
  [/X-Generator:\s*Drupal/i, 'Drupal', ''],
  [/X-AWStats-Version:/i, 'AWStats', ''],
  [/Server:\s*MiniServ[\/\s]*(\d+\.\d+)/i, 'Webmin', '1'],
  [/Server:\s*GitLab/i, 'GitLab', ''],
  [/X-GitLab-Version:/i, 'GitLab', ''],
  [/Server:\s*GitHub\.com/i, 'GitHub Pages', ''],
  [/X-GitHub-Request-Id:/i, 'GitHub Pages', ''],
  [/Server:\s*AmazonS3/i, 'Amazon S3', ''],
  [/X-Amz-Request-Id:/i, 'Amazon S3', ''],
  [/X-Cloud-Trace-Context:/i, 'Google Cloud', ''],
  [/X-Azure-Ref:/i, 'Azure CDN', ''],
  [/Server:\s*Cloudflare/i, 'Cloudflare', ''],
  [/cf-ray:/i, 'Cloudflare', ''],
  [/Server:\s*Akamai/i, 'Akamai', ''],
  [/X-Akamai-Request-BC:/i, 'Akamai', ''],
  [/Server:\s*KeyCDN/i, 'KeyCDN', ''],
  [/Server:\s* BunnyCDN/i, 'BunnyCDN', ''],
  [/Server:\s*CDN77/i, 'CDN77', ''],
];

function extractTech(banner: string): string | null {
  for (const [re, name] of TECH_PATTERNS) { if (re.test(banner)) return name; }
  return null;
}
function extractVersion(banner: string): string | null {
  for (const [re, , group] of TECH_PATTERNS) {
    if (!group) continue;
    const m = banner.match(re);
    if (m && m[parseInt(group)]) return m[parseInt(group)];
  }
  return null;
}
function mapCves(tech: string, version: string): string[] {
  const key = Object.keys(CVE_DATABASE).find((k) => tech.toLowerCase().includes(k));
  if (!key || !version) return [];
  const vMap = CVE_DATABASE[key];
  if (key === 'iis' && version.split('.').length < 3) return [];
  const exact = vMap[version];
  if (exact) return exact;
  const majorMinor = version.split('.').slice(0, 2).join('.');
  const partial = vMap[majorMinor];
  if (partial) return partial;
  return [];
}

// ─── TCP Connect ───────────────────────────────────────────────────────────
async function tcpConnect(ip: string, port: number, ms = 2000): Promise<boolean> {
  const { connect } = await import('net');
  return new Promise((resolve) => {
    const socket = connect(port, ip);
    let resolved = false;
    socket.on('connect', () => { if (!resolved) { resolved = true; socket.destroy(); resolve(true); } });
    socket.on('error', () => { if (!resolved) { resolved = true; resolve(false); } });
    socket.on('timeout', () => { if (!resolved) { resolved = true; socket.destroy(); resolve(false); } });
    socket.setTimeout(ms);
  });
}

async function grabBanner(ip: string, port: number, ms = 3000): Promise<string> {
  const { connect } = await import('net');
  return new Promise((resolve) => {
    const socket = connect(port, ip);
    let banner = '';
    let resolved = false;
    socket.on('connect', () => { socket.write(`HEAD / HTTP/1.0\r\nHost: ${ip}\r\nUser-Agent: Mozilla/5.0\r\n\r\n`); });
    socket.on('data', (data) => { banner += data.toString(); if (banner.length > 4096) { resolved = true; socket.destroy(); resolve(banner.slice(0, 4096)); } });
    socket.on('error', () => { if (!resolved) { resolved = true; resolve(banner); } });
    socket.on('timeout', () => { if (!resolved) { resolved = true; socket.destroy(); resolve(banner); } });
    socket.setTimeout(ms);
    setTimeout(() => { if (!resolved) { resolved = true; socket.destroy(); resolve(banner); } }, ms + 500);
  });
}

// ─── Fetch Headers (with redirect + SSL) ───────────────────────────────────
async function fetchHeaders(url: string, ms = 12000): Promise<{ status: number; headers: Record<string, string>; body: string }> {
  const doFetch = (targetUrl: string, timeoutMs: number): Promise<{ status: number; headers: Record<string, string>; body: string }> => {
    return new Promise((resolve) => {
      const client = targetUrl.startsWith('https:') ? httpsRequest : httpRequest;
      const req = client(
        targetUrl,
        {
          method: 'GET',
          timeout: timeoutMs,
          rejectUnauthorized: false,
          headers: {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
            'Accept-Language': 'en-US,en;q=0.5',
            'Accept-Encoding': 'identity',
            'Connection': 'close',
          },
        },
        (res) => {
          if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
            let redirectUrl = res.headers.location;
            if (redirectUrl.startsWith('/')) {
              const parsed = new URL(targetUrl);
              redirectUrl = `${parsed.protocol}//${parsed.host}${redirectUrl}`;
            }
            if (!redirectUrl.startsWith('http')) {
              const parsed = new URL(targetUrl);
              redirectUrl = `${parsed.protocol}//${parsed.host}/${redirectUrl}`;
            }
            resolve(doFetch(redirectUrl, Math.max(timeoutMs - 2000, 2000)));
            return;
          }
          let body = '';
          res.on('data', (c) => { body += c; if (body.length > 262144) res.destroy(); });
          res.on('end', () => {
            const headers: Record<string, string> = {};
            for (const [k, v] of Object.entries(res.headers)) headers[k.toLowerCase()] = Array.isArray(v) ? v.join(', ') : String(v ?? '');
            resolve({ status: res.statusCode || 0, headers, body: body.slice(0, 65536) });
          });
        }
      );
      req.on('error', () => resolve({ status: 0, headers: {}, body: '' }));
      req.on('timeout', () => { req.destroy(); resolve({ status: 0, headers: {}, body: '' }); });
      req.end();
    });
  };
  return doFetch(url, ms);
}

// ─── DNS Analysis ──────────────────────────────────────────────────────────
async function analyzeDNS(domain: string): Promise<{ records: DNSRecord[]; spfPolicy?: string; dmarcPolicy?: string; dkimPresent?: boolean; dnssec?: boolean }> {
  const records: DNSRecord[] = [];
  try {
    const aRecords = await resolve4(domain);
    for (const ip of aRecords) records.push({ type: 'A', value: ip });
  } catch {}
  try {
    const mxRecords = await resolveMx(domain);
    for (const mx of mxRecords) records.push({ type: 'MX', value: mx.exchange, priority: mx.priority });
  } catch {}
  try {
    const txtRecords = await resolveTxt(domain);
    for (const txt of txtRecords.flat()) {
      records.push({ type: 'TXT', value: txt });
      if (txt.toLowerCase().startsWith('v=spf1')) {
        records[records.length - 1].type = 'TXT';
      }
    }
  } catch {}
  try {
    const nsRecords = await resolveNs(domain);
    for (const ns of nsRecords) records.push({ type: 'NS', value: ns });
  } catch {}
  try {
    const soa = await resolveSoa(domain);
    records.push({ type: 'SOA', value: `${soa.nsname} ${soa.hostmaster}` });
  } catch {}

  // Check DMARC
  let dmarcPolicy: string | undefined;
  try {
    const dmarcRecords = await resolveTxt(`_dmarc.${domain}`);
    const dmarc = dmarcRecords.flat().find((r) => r.toLowerCase().startsWith('v=dmarc1'));
    if (dmarc) {
      const p = dmarc.match(/p=([a-z]+)/i);
      dmarcPolicy = p ? p[1] : 'none';
    }
  } catch {}

  // Check SPF
  let spfPolicy: string | undefined;
  try {
    const txtRecords = await resolveTxt(domain);
    const spf = txtRecords.flat().find((r) => r.toLowerCase().startsWith('v=spf1'));
    if (spf) spfPolicy = spf.includes('-all') ? 'strict' : spf.includes('~all') ? 'softfail' : 'none';
  } catch {}

  // Check DKIM (common selectors)
  let dkimPresent = false;
  const selectors = ['default', 'google', 'selector1', 'selector2', 'mail'];
  for (const sel of selectors) {
    try {
      await resolveTxt(`${sel}._domainkey.${domain}`);
      dkimPresent = true;
      break;
    } catch {}
  }

  return { records, spfPolicy, dmarcPolicy, dkimPresent, dnssec: false };
}

// ─── SSL Analysis with Grading ─────────────────────────────────────────────
async function checkSSL(hostname: string): Promise<SSLInfo | null> {
  try {
    const { request } = await import('https');
    return new Promise((resolve) => {
      const req = request({ hostname, port: 443, method: 'HEAD', timeout: 8000, rejectUnauthorized: false }, (res) => {
        const sock = (res as any).socket;
        if (!sock || !sock.getPeerCertificate) { resolve(null); return; }
        const cert = sock.getPeerCertificate(true);
        if (!cert || Object.keys(cert).length === 0) { resolve(null); return; }
        const validTo = cert.valid_to ? new Date(cert.valid_to) : undefined;
        const daysRemaining = validTo ? Math.floor((validTo.getTime() - Date.now()) / (1000 * 60 * 60 * 24)) : undefined;
        const selfSigned = cert.issuer && cert.subject && JSON.stringify(cert.issuer) === JSON.stringify(cert.subject);
        const tlsVersion = sock.getProtocol ? sock.getProtocol() : undefined;
        const cipherSuite = sock.getCipher ? sock.getCipher().name : undefined;
        const hsts = !!res.headers['strict-transport-security'];
        resolve({
          issuer: cert.issuer?.O || cert.issuer?.CN,
          subject: cert.subject?.CN,
          validFrom: cert.valid_from,
          validTo: cert.valid_to,
          daysRemaining,
          valid: daysRemaining !== undefined && daysRemaining > 0,
          selfSigned,
          weakCipher: cipherSuite ? /^(RC4|DES|3DES|MD5|NULL|EXPORT)/i.test(cipherSuite) : false,
          tlsVersion,
          cipherSuite,
          hsts,
          certificateTransparency: true,
          sni: true,
        });
      });
      req.on('error', () => resolve(null));
      req.on('timeout', () => { req.destroy(); resolve(null); });
      req.end();
    });
  } catch { return null; }
}

function gradeSSL(ssl: SSLInfo | null): DiscoveredAsset['sslGrade'] {
  if (!ssl) return 'X';
  if (!ssl.valid) return 'F';
  if (ssl.selfSigned) return 'T';
  let score = 100;
  if (ssl.daysRemaining !== undefined && ssl.daysRemaining < 30) score -= 20;
  if (ssl.weakCipher) score -= 30;
  if (ssl.tlsVersion === 'TLSv1' || ssl.tlsVersion === 'TLSv1.1') score -= 25;
  if (!ssl.hsts) score -= 10;
  if (score >= 95) return 'A+';
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  if (score >= 50) return 'D';
  return 'E';
}

// ─── Web Vulnerability Detection ───────────────────────────────────────────
async function detectWebVulns(url: string, headers: Record<string, string>, body: string): Promise<WebVuln[]> {
  const vulns: WebVuln[] = [];
  const baseUrl = url;

  // SQLi patterns in error messages
  const sqliPatterns = [
    /sql syntax.*mysql/i, /warning.*mysql/i, /mysql_fetch_/i, /pg_query/i,
    /ora-[0-9]{4,5}/i, /microsoft.*odbc.*error/i, /sql server.*error/i,
    /unclosed quotation mark/i, /quoted string not properly terminated/i,
  ];
  for (const p of sqliPatterns) {
    if (p.test(body)) {
      vulns.push({ type: 'sqli', severity: 'critical', url: baseUrl, description: 'SQL error message detected in response — potential SQL injection point', evidence: body.slice(0, 200), confidence: 'potential' });
      break;
    }
  }

  // XSS reflected detection (basic)
  if (/<script[^>]*>.*?alert\(.*?\).*?<\/script>/i.test(body) || /javascript:alert\(/i.test(body)) {
    vulns.push({ type: 'xss', severity: 'high', url: baseUrl, description: 'Potential reflected XSS detected in response body', confidence: 'potential' });
  }

  // LFI/RFI patterns
  const lfiPatterns = [
    /root:.*:0:0:/, /\[boot loader\]/, /\[fonts\]/,
    /etc\/passwd/i, /..\/..\/etc\/passwd/i, /file:\/\/\//i,
  ];
  for (const p of lfiPatterns) {
    if (p.test(body)) {
      vulns.push({ type: 'lfi', severity: 'critical', url: baseUrl, description: 'Potential Local File Inclusion — sensitive file content in response', confidence: 'potential' });
      break;
    }
  }

  // Open Redirect
  if (headers.location && /^https?:\/\//i.test(headers.location) && !headers.location.includes(new URL(baseUrl).hostname)) {
    vulns.push({ type: 'open_redirect', severity: 'medium', url: baseUrl, description: `Open redirect to external domain: ${headers.location}`, confidence: 'confirmed' });
  }

  // CORS Misconfiguration
  if (headers['access-control-allow-origin'] === '*') {
    vulns.push({ type: 'cors', severity: 'medium', url: baseUrl, description: 'Overly permissive CORS: Access-Control-Allow-Origin: *', confidence: 'confirmed' });
  }
  if (headers['access-control-allow-credentials'] === 'true' && headers['access-control-allow-origin'] === '*') {
    vulns.push({ type: 'cors', severity: 'high', url: baseUrl, description: 'Dangerous CORS: Allow-Credentials=true with wildcard origin', confidence: 'confirmed' });
  }

  // Missing CSRF protection (if login form detected)
  if (/type=["']password["']/i.test(body) && !/csrf|token/i.test(body.toLowerCase())) {
    vulns.push({ type: 'csrf', severity: 'medium', url: baseUrl, description: 'Login form without CSRF token protection', confidence: 'potential' });
  }

  // Information Disclosure
  if (body.toLowerCase().includes('phpinfo')) vulns.push({ type: 'info_disclosure', severity: 'high', url: baseUrl, description: 'phpinfo() exposure detected', confidence: 'confirmed' });
  if (body.includes('.env')) vulns.push({ type: 'info_disclosure', severity: 'critical', url: baseUrl, description: 'Potential .env file exposure', confidence: 'potential' });
  if (body.includes('AWS_ACCESS_KEY_ID') || body.includes('AKIA')) vulns.push({ type: 'info_disclosure', severity: 'critical', url: baseUrl, description: 'AWS credentials exposure', confidence: 'confirmed' });
  if (body.includes('-----BEGIN RSA PRIVATE KEY-----') || body.includes('-----BEGIN OPENSSH PRIVATE KEY-----')) {
    vulns.push({ type: 'info_disclosure', severity: 'critical', url: baseUrl, description: 'Private key exposure in response', confidence: 'confirmed' });
  }

  // Backup/Sensitive files
  const sensitiveFiles = ['.git', '.svn', '.htaccess', '.DS_Store', 'web.config', 'robots.txt', 'sitemap.xml', 'crossdomain.xml'];
  for (const file of sensitiveFiles) {
    if (body.toLowerCase().includes(file)) {
      vulns.push({ type: 'sensitive_file', severity: 'low', url: baseUrl, description: `Reference to sensitive file: ${file}`, confidence: 'potential' });
    }
  }

  // Weak authentication
  if (headers['www-authenticate'] && headers['www-authenticate'].toLowerCase().includes('basic')) {
    vulns.push({ type: 'weak_auth', severity: 'medium', url: baseUrl, description: 'Basic HTTP authentication detected (sends credentials in base64)', confidence: 'confirmed' });
  }

  return vulns;
}

// ─── Cloud Detection ───────────────────────────────────────────────────────
async function detectCloud(domain: string): Promise<CloudAsset[]> {
  const assets: CloudAsset[] = [];
  const prefixes = [
    domain.replace(/\./g, '-'),
    domain.replace(/\./g, ''),
    domain.split('.')[0],
    `${domain.split('.')[0]}-assets`,
    `${domain.split('.')[0]}-data`,
    `${domain.split('.')[0]}-backup`,
    `${domain.split('.')[0]}-uploads`,
    `${domain.split('.')[0]}-static`,
    `${domain.split('.')[0]}-media`,
    `${domain.split('.')[0]}-files`,
    `${domain.split('.')[0]}-cdn`,
    `${domain.split('.')[0]}-dev`,
    `${domain.split('.')[0]}-staging`,
    `${domain.split('.')[0]}-prod`,
    `${domain.split('.')[0]}-test`,
  ];

  // S3 Buckets
  for (const prefix of prefixes.slice(0, 6)) {
    try {
      const res = await fetch(`https://${prefix}.s3.amazonaws.com`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res.status === 200) {
        assets.push({
          id: genId(), provider: 'aws', serviceType: 's3', resourceId: prefix,
          url: `https://${prefix}.s3.amazonaws.com`, permissions: ['public-read'],
          misconfigurations: [{ type: 'public_bucket', severity: 'critical', description: `S3 bucket ${prefix} is publicly readable` } as Finding],
          riskScore: 95, severity: 'critical'
        });
      } else if (res.status === 403) {
        assets.push({
          id: genId(), provider: 'aws', serviceType: 's3', resourceId: prefix,
          url: `https://${prefix}.s3.amazonaws.com`, permissions: ['denied'],
          misconfigurations: [{ type: 'bucket_exists', severity: 'medium', description: `S3 bucket ${prefix} exists but access denied (enumerate)` } as Finding],
          riskScore: 40, severity: 'medium'
        });
      }
    } catch { /* ignore */ }
  }

  // GCS Buckets
  for (const prefix of prefixes.slice(0, 4)) {
    try {
      const res = await fetch(`https://storage.googleapis.com/${prefix}`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res.status === 200) {
        assets.push({
          id: genId(), provider: 'gcp', serviceType: 'gcs', resourceId: prefix,
          url: `https://storage.googleapis.com/${prefix}`, permissions: ['public-read'],
          misconfigurations: [{ type: 'public_bucket', severity: 'critical', description: `GCS bucket ${prefix} is publicly readable` } as Finding],
          riskScore: 95, severity: 'critical'
        });
      }
    } catch { /* ignore */ }
  }

  // Azure Blobs
  for (const prefix of prefixes.slice(0, 4)) {
    try {
      const res = await fetch(`https://${prefix}.blob.core.windows.net`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res.status === 200) {
        assets.push({
          id: genId(), provider: 'azure', serviceType: 'blob', resourceId: prefix,
          url: `https://${prefix}.blob.core.windows.net`, permissions: ['public-read'],
          misconfigurations: [{ type: 'public_container', severity: 'critical', description: `Azure blob container ${prefix} is publicly readable` } as Finding],
          riskScore: 95, severity: 'critical'
        });
      }
    } catch { /* ignore */ }
  }

  // Firebase
  try {
    const res = await fetch(`https://${domain.replace(/\./g, '-')}.firebaseio.com/.json`, { method: 'GET', signal: AbortSignal.timeout(5000) });
    if (res.status === 200) {
      assets.push({
        id: genId(), provider: 'firebase', serviceType: 'realtime-db', resourceId: domain,
        url: `https://${domain.replace(/\./g, '-')}.firebaseio.com`, permissions: ['public-read'],
        misconfigurations: [{ type: 'public_database', severity: 'critical', description: 'Firebase Realtime Database is publicly readable' } as Finding],
        riskScore: 95, severity: 'critical'
      });
    }
  } catch { /* ignore */ }

  // DigitalOcean Spaces
  for (const prefix of prefixes.slice(0, 3)) {
    try {
      const res = await fetch(`https://${prefix}.nyc3.digitaloceanspaces.com`, { method: 'GET', signal: AbortSignal.timeout(5000) });
      if (res.status === 200) {
        assets.push({
          id: genId(), provider: 'digitalocean', serviceType: 'spaces', resourceId: prefix,
          url: `https://${prefix}.nyc3.digitaloceanspaces.com`, permissions: ['public-read'],
          misconfigurations: [{ type: 'public_bucket', severity: 'critical', description: `DO Spaces bucket ${prefix} is publicly readable` } as Finding],
          riskScore: 95, severity: 'critical'
        });
      }
    } catch { /* ignore */ }
  }

  return assets;
}

// ─── Certificate Transparency ──────────────────────────────────────────────
async function queryCrtsh(domain: string): Promise<string[]> {
  try {
    const res = await fetch(`https://crt.sh/?q=%25.${encodeURIComponent(domain)}&output=json`, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return [];
    const data = (await res.json()) as Array<{ name_value: string }>;
    const subs = new Set<string>();
    for (const entry of data) {
      for (const n of entry.name_value.split('\\n')) {
        const trimmed = n.trim().replace('*.', '');
        if (trimmed.endsWith(domain) && trimmed !== domain && trimmed.includes('.')) subs.add(trimmed);
      }
    }
    return Array.from(subs);
  } catch { return []; }
}

async function resolveBulk(domains: string[], concurrency = 200): Promise<Record<string, string[]>> {
  const results: Record<string, string[]> = {};
  for (let i = 0; i < domains.length; i += concurrency) {
    const batch = domains.slice(i, i + concurrency);
    const settled = await Promise.allSettled(batch.map((d) => resolve4(d).catch(() => [])));
    for (let j = 0; j < batch.length; j++) {
      const r = settled[j];
      results[batch[j]] = r.status === 'fulfilled' ? (r.value as string[]) : [];
    }
  }
  return results;
}

// ─── ShadowSurfaceEngine ───────────────────────────────────────────────────
export class ShadowSurfaceEngine {
  scanResult: ScanResult;
  private targetDomain: string;

  constructor(target: string) {
    this.targetDomain = target;
    this.scanResult = {
      scanId: genId(),
      target,
      startedAt: new Date().toISOString(),
      assets: [],
      cloudAssets: [],
      statistics: { totalSubdomains: 0, totalAssets: 0, totalCloudAssets: 0, criticalFindings: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0, infoCount: 0, totalCVEs: 0, totalWebVulns: 0, sslIssues: 0 },
      executiveSummary: { overallRisk: 'LOW', riskScore: 0, criticalFindings: 0, attackSurfaceSize: 0, recommendations: [], threatActors: [] },
    };
  }

  async enumerateSubdomains(): Promise<Record<string, string[]>> {
    const [wordlistSubs, crtSubs] = await Promise.all([
      Promise.all(SUBDOMAIN_WORDLIST.map(async (w) => {
        const sub = `${w}.${this.targetDomain}`;
        try { const ips = await resolve4(sub); return { sub, ips }; } catch { return null; }
      })),
      queryCrtsh(this.targetDomain),
    ]);

    const result: Record<string, string[]> = {};
    for (const r of wordlistSubs) { if (r && r.ips.length > 0) result[r.sub] = r.ips; }
    for (const sub of crtSubs) {
      if (!result[sub]) {
        try { const ips = await resolve4(sub); if (ips.length > 0) result[sub] = ips; } catch {}
      }
    }
    try { const ips = await resolve4(this.targetDomain); if (ips.length > 0) result[this.targetDomain] = ips; } catch {}
    return result;
  }

  async scanPortsOnAssets(subdomainIps: Record<string, string[]>, ports: number[]): Promise<DiscoveredAsset[]> {
    const assets: DiscoveredAsset[] = [];
    const entries = Object.entries(subdomainIps);

    for (let i = 0; i < entries.length; i += 5) {
      const batch = entries.slice(i, i + 5);
      const results = await Promise.allSettled(batch.map(async ([subdomain, ips]) => {
        if (!ips[0]) return null;
        const ip = ips[0];
        const openPorts: number[] = [];
        for (const port of ports) { if (await tcpConnect(ip, port, 2000)) openPorts.push(port); }
        if (openPorts.length === 0) return null;

        const priority = [443, 8443, 9443, 4433, 80, 8080, 8081, 8000, 8008];
        openPorts.sort((a, b) => {
          const pa = priority.indexOf(a); const pb = priority.indexOf(b);
          if (pa !== -1 && pb !== -1) return pa - pb;
          if (pa !== -1) return -1;
          if (pb !== -1) return 1;
          return a - b;
        });
        const primaryPort = openPorts[0];

        const asset: DiscoveredAsset = {
          id: genId(), domain: this.targetDomain, subdomain, ip, port: primaryPort,
          service: SERVICE_NAMES[primaryPort] || 'Unknown', banner: '', technology: null,
          version: null, cves: [], cveConfidence: 'low', cloudProvider: null, riskScore: 0,
          findings: [], headers: {}, firstSeen: new Date().toISOString(),
        };

        const banner = await grabBanner(ip, primaryPort, 3000);
        asset.banner = banner;
        const tech = extractTech(banner);
        const version = extractVersion(banner);
        if (tech) { asset.technology = tech; asset.version = version; }

        if (openPorts.length > 1) {
          for (const p of openPorts.slice(1)) {
            asset.findings.push({ type: 'open_port', severity: 'info', port: p, service: SERVICE_NAMES[p] || 'Unknown', description: `Port ${p} (${SERVICE_NAMES[p] || 'Unknown'}) is open` });
          }
        }

        const dangerPorts: Record<number, { severity: 'critical'|'high'|'medium'|'low'; desc: string; score: number }> = {

          3389: { severity: 'critical', desc: 'RDP exposed to internet', score: 85 },
          23: { severity: 'critical', desc: 'Telnet (cleartext) exposed', score: 90 },
          21: { severity: 'high', desc: 'FTP exposed - potential anonymous access', score: 65 },
          3306: { severity: 'critical', desc: 'MySQL database exposed', score: 80 },
          5432: { severity: 'critical', desc: 'PostgreSQL exposed', score: 75 },
          6379: { severity: 'high', desc: 'Redis exposed without auth', score: 70 },
          9200: { severity: 'high', desc: 'Elasticsearch exposed', score: 65 },
          27017: { severity: 'critical', desc: 'MongoDB exposed', score: 75 },
          5900: { severity: 'high', desc: 'VNC exposed', score: 70 },
          445: { severity: 'high', desc: 'SMB exposed', score: 70 },
          111: { severity: 'medium', desc: 'RPCbind exposed', score: 45 },
          2049: { severity: 'medium', desc: 'NFS exposed', score: 50 },
          2375: { severity: 'critical', desc: 'Docker daemon exposed', score: 80 },
          2376: { severity: 'critical', desc: 'Docker daemon (SSL) exposed', score: 75 },
          6443: { severity: 'high', desc: 'Kubernetes API exposed', score: 75 },
          9300: { severity: 'high', desc: 'Elasticsearch node communication exposed', score: 60 },
          11211: { severity: 'high', desc: 'Memcached exposed', score: 65 },
          5000: { severity: 'medium', desc: 'UPnP/Docker exposed', score: 45 },
          5601: { severity: 'medium', desc: 'Kibana exposed', score: 50 },
          9090: { severity: 'medium', desc: 'Prometheus/WebSM exposed', score: 45 },
          3000: { severity: 'low', desc: 'Grafana/Development server exposed', score: 30 },
          8000: { severity: 'low', desc: 'Development server exposed', score: 25 },
        };
        for (const p of openPorts) {
          const d = dangerPorts[p];
          if (d) asset.findings.push({ type: 'exposed_service', severity: d.severity, port: p, service: SERVICE_NAMES[p] || 'Unknown', description: d.desc });
        }

        return asset;
      }));
      for (const r of results) { if (r.status === 'fulfilled' && r.value) assets.push(r.value); }
    }
    return assets;
  }

  async analyzeWebAssets(assets: DiscoveredAsset[], cveLimit: 'lite' | 'full' = 'full'): Promise<DiscoveredAsset[]> {
    const webAssets = assets.filter((a) => [80,443,8080,8081,8443,9443,8000,8008,4433].includes(a.port));

    for (let i = 0; i < webAssets.length; i += 10) {
      const batch = webAssets.slice(i, i + 10);
      await Promise.allSettled(batch.map(async (asset) => {
        const proto = asset.port === 443 || asset.port === 8443 || asset.port === 9443 || asset.port === 4433 ? 'https' : 'http';
        const url = `${proto}://${asset.subdomain || asset.ip}:${asset.port}`;
        try {
          let { headers, body, status } = await fetchHeaders(url, 12000);
          if (status === 0) {
            const fallbackUrl = proto === 'https' ? url.replace('https://', 'http://') : url.replace('http://', 'https://');
            const fb = await fetchHeaders(fallbackUrl, 8000);
            if (fb.status !== 0) { headers = fb.headers; body = fb.body; status = fb.status; }
          }
          asset.headers = headers;
          const server = headers['server'] || '';
          const powered = headers['x-powered-by'] || '';
          const title = body.match(/<title>([^<]*)<\/title>/i)?.[1] || '';
          asset.title = title;

          // WAF/CDN
          if (headers['cf-ray']) asset.waf = 'Cloudflare';
          else if (headers['x-akamai-transformed']) asset.waf = 'Akamai';
          else if (headers['x-amzn-requestid']) asset.waf = 'AWS CloudFront';
          else if (headers['x-sucuri-id']) asset.waf = 'Sucuri';
          else if (server.toLowerCase().includes('cloudflare')) asset.waf = 'Cloudflare';
          else if (body.includes('cdn-cgi')) asset.waf = 'Cloudflare';
          else if (body.includes('sucuri')) asset.waf = 'Sucuri';
          else if (body.includes('__cf_bm')) asset.waf = 'Cloudflare';
          else if (headers['x-waf-event']) asset.waf = 'Generic WAF';
          else if (headers['x-cdn']) asset.waf = headers['x-cdn'];

          // Tech detection
          if (server) { asset.technology = extractTech(server) || asset.technology; asset.version = extractVersion(server) || asset.version; }
          if (powered && !asset.technology) asset.technology = extractTech(powered) || asset.technology;
          if (!asset.technology) {
            if (body.includes('wp-content') || body.includes('wp-includes')) asset.technology = 'WordPress';
            else if (body.includes('/sites/default/') || body.includes('Drupal')) asset.technology = 'Drupal';
            else if (body.includes('/media/jui/') || body.includes('Joomla')) asset.technology = 'Joomla';
            else if (body.includes('__NEXT_DATA__')) asset.technology = 'Next.js';
            else if (body.includes('_nuxt')) asset.technology = 'Nuxt.js';
            else if (body.includes('laravel') || body.includes('csrf-token')) asset.technology = 'Laravel';
            else if (body.includes('X-CSRFToken') || body.includes('django')) asset.technology = 'Django';
            else if (body.includes('express')) asset.technology = 'Express';
            else if (body.includes('spring')) asset.technology = 'Spring';
            else if (body.includes('fastapi')) asset.technology = 'FastAPI';
            else if (body.includes('flask')) asset.technology = 'Flask';
            else if (body.includes('ruby') || body.includes('rails')) asset.technology = 'Ruby on Rails';
            else if (body.includes('Shopify')) asset.technology = 'Shopify';
            else if (body.includes('reactroot') || body.includes('data-reactroot')) asset.technology = 'React';
            else if (body.includes('angular') || body.includes('ng-')) asset.technology = 'Angular';
            else if (body.includes('vue') || body.includes('v-')) asset.technology = 'Vue.js';
            else if (body.includes('svelte')) asset.technology = 'Svelte';
          }

          // CVE mapping
          if (asset.technology && asset.version) {
            const allCves = mapCves(asset.technology, asset.version);
            asset.cves = cveLimit === 'lite' ? allCves.slice(0, 3) : allCves;
            asset.cveConfidence = allCves.length > 0 ? 'high' : 'low';
          }

          // SSL Analysis
          if (asset.port === 443 || asset.port === 8443 || asset.port === 9443) {
            asset.sslInfo = await checkSSL(asset.subdomain || asset.ip || '');
            asset.sslGrade = gradeSSL(asset.sslInfo);
            if (asset.sslInfo) {
              if (asset.sslInfo.daysRemaining !== undefined && asset.sslInfo.daysRemaining < 30) {
                asset.findings.push({ type: 'ssl_expiring', severity: asset.sslInfo.daysRemaining < 7 ? 'critical' : 'high', description: `SSL certificate expires in ${asset.sslInfo.daysRemaining} days` });
              }
              if (asset.sslInfo.selfSigned) {
                asset.findings.push({ type: 'ssl_self_signed', severity: 'high', description: 'Self-signed SSL certificate detected' });
              }
              if (asset.sslInfo.weakCipher) {
                asset.findings.push({ type: 'ssl_weak_cipher', severity: 'high', description: `Weak SSL cipher: ${asset.sslInfo.cipherSuite}` });
              }
              if (asset.sslInfo.tlsVersion && (asset.sslInfo.tlsVersion === 'TLSv1' || asset.sslInfo.tlsVersion === 'TLSv1.1')) {
                asset.findings.push({ type: 'ssl_deprecated_tls', severity: 'high', description: `Deprecated TLS version: ${asset.sslInfo.tlsVersion}` });
              }
              if (!asset.sslInfo.hsts && asset.port === 443) {
                asset.findings.push({ type: 'missing_hsts', severity: 'medium', description: 'HSTS header missing on HTTPS' });
              }
            } else {
              asset.findings.push({ type: 'ssl_invalid', severity: 'high', description: 'SSL certificate missing or invalid' });
            }
          }

          // Security Headers
          const requiredHeaders = ['content-security-policy','x-frame-options','x-content-type-options','referrer-policy'];
          if (asset.port === 443 || asset.port === 8443) requiredHeaders.push('strict-transport-security');
          const missing = requiredHeaders.filter(h => !headers[h]);
          if (missing.length > 0) {
            const severity = missing.includes('strict-transport-security') || missing.includes('content-security-policy') || missing.includes('x-frame-options') ? 'medium' : 'low';
            asset.findings.push({ type: 'missing_security_headers', severity, description: `Missing ${missing.length} header(s): ${missing.join(', ')}` });
          }

          // Server disclosure
          if (headers['server'] && /\d+\.\d+/.test(headers['server'])) {
            asset.findings.push({ type: 'information_disclosure', severity: 'low', description: `Server version disclosed: ${headers['server']}` });
          }

          // Web Vulnerability Detection
          asset.webVulns = await detectWebVulns(url, headers, body);

          // Admin panels
          const adminPaths = ['/admin','/administrator','/wp-admin','/dashboard','/login','/signin','/manage','/backend','/control','/cpanel'];
          for (const p of adminPaths) {
            if (body.toLowerCase().includes(p)) {
              asset.findings.push({ type: 'admin_panel_reference', severity: 'low', description: `Potential admin panel detected: ${p}` });
              break;
            }
          }

          // Directory Listing
          if (body.includes('<title>Index of /') || body.includes('Directory Listing For') || body.includes('<h1>Index of')) {
            asset.findings.push({ type: 'directory_listing', severity: 'medium', description: 'Directory listing enabled' });
          }

          // Open Redirect
          if (body.includes('window.location') || body.includes('location.href') || body.includes('meta http-equiv="refresh"')) {
            asset.findings.push({ type: 'potential_open_redirect', severity: 'low', description: 'Potential open redirect vectors detected' });
          }

          // CORS
          if (headers['access-control-allow-origin'] === '*') {
            asset.findings.push({ type: 'cors_misconfiguration', severity: 'medium', description: 'Overly permissive CORS: Access-Control-Allow-Origin: *' });
          }

          // Cookies
          const setCookie = headers['set-cookie'] || '';
          if (setCookie && (!setCookie.includes('Secure') || !setCookie.includes('HttpOnly'))) {
            asset.findings.push({ type: 'insecure_cookie', severity: 'medium', description: 'Cookie missing Secure/HttpOnly flags' });
          }

        } catch {
          asset.findings.push({ type: 'unreachable', severity: 'info', description: 'Web asset unreachable during analysis' });
        }
      }));
    }
    return assets;
  }

  async scanCloudInfrastructure(): Promise<CloudAsset[]> {
    return detectCloud(this.targetDomain);
  }

  async scanDNS(): Promise<{ records: DNSRecord[]; spfPolicy?: string; dmarcPolicy?: string; dkimPresent?: boolean; dnssec?: boolean }> {
    return analyzeDNS(this.targetDomain);
  }

  dedupeFindings(assets: DiscoveredAsset[]) {
    for (const asset of assets) {
      const seen = new Set<string>();
      asset.findings = asset.findings.filter((f) => {
        const key = `${f.type}|${f.port || ''}|${f.description}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });
    }
  }

  calculateRiskScores(assets: DiscoveredAsset[], cloudAssets: CloudAsset[]) {
    for (const asset of assets) {
      let score = 0;
      // CVE score (capped at 60)
      if (asset.cves.length > 0) score += Math.min(asset.cves.length * 25, 60);
      // Web vulns (capped at 40)
      if (asset.webVulns) {
        let webScore = 0;
        for (const v of asset.webVulns) {
          if (v.severity === 'critical') webScore += 25;
          else if (v.severity === 'high') webScore += 15;
          else if (v.severity === 'medium') webScore += 8;
          else if (v.severity === 'low') webScore += 3;
        }
        score += Math.min(webScore, 40);
      }
      // Findings (exclude info/open_port, capped at 50)
      let findingScore = 0;
      for (const f of asset.findings) {
        if (f.type === 'open_port' || f.severity === 'info') continue;
        const sev = f.severity || '';
        if (sev === 'critical') findingScore += 20;
        else if (sev === 'high') findingScore += 12;
        else if (sev === 'medium') findingScore += 6;
        else if (sev === 'low') findingScore += 2;
      }
      score += Math.min(findingScore, 50);
      // SSL penalty
      if (asset.sslGrade && ['F','T','X'].includes(asset.sslGrade)) score += 15;
      else if (asset.sslGrade === 'D' || asset.sslGrade === 'E') score += 8;
      else if (asset.sslGrade === 'C') score += 3;

      asset.riskScore = Math.min(Math.round(score), 100);
    }
  }

  generateRecommendations(assets: DiscoveredAsset[], cloudAssets: CloudAsset[], dnsInfo?: any): string[] {
    const recs: string[] = [];
    if (assets.some((a) => a.findings.some((f) => f.type === 'exposed_service' && f.severity === 'critical'))) {
      recs.push('Immediately restrict access to critical exposed services (RDP, databases, Telnet) via firewall rules');
    }
    if (assets.some((a) => a.cves.length > 0)) {
      recs.push(`Patch ${assets.reduce((sum, a) => sum + a.cves.length, 0)} discovered CVEs on affected services`);
    }
    if (assets.some((a) => a.webVulns && a.webVulns.length > 0)) {
      recs.push('Review and fix web application vulnerabilities (SQLi, XSS, LFI) identified in scan results');
    }
    if (assets.some((a) => a.sslGrade && ['D','E','F','T','X'].includes(a.sslGrade))) {
      recs.push('Upgrade TLS configuration and replace weak/self-signed SSL certificates');
    }
    if (assets.some((a) => a.findings.some((f) => f.type === 'missing_security_headers'))) {
      recs.push('Implement security headers (CSP, HSTS, X-Frame-Options, X-Content-Type-Options) on all web assets');
    }
    if (cloudAssets.length > 0) {
      recs.push('Audit cloud storage permissions and enforce least-privilege access policies');
    }
    if (dnsInfo && !dnsInfo.dmarcPolicy) {
      recs.push('Configure DMARC DNS record to protect against email spoofing');
    }
    if (dnsInfo && dnsInfo.spfPolicy === 'none') {
      recs.push('Harden SPF policy with -all directive');
    }
    if (recs.length === 0) recs.push('Continue regular scanning and maintain current security posture');
    return recs;
  }

  generateThreatActors(assets: DiscoveredAsset[]): string[] {
    const actors: string[] = [];
    const hasCritical = assets.some((a) => a.riskScore >= 70);
    const hasWeb = assets.some((a) => a.webVulns && a.webVulns.length > 0);
    const hasDB = assets.some((a) => [3306,5432,27017,6379,9200].includes(a.port));
    const hasRDP = assets.some((a) => a.port === 3389);

    if (hasCritical) actors.push('Opportunistic attackers scanning for known CVEs');
    if (hasWeb) actors.push('Web application attackers (SQL injection, XSS specialists)');
    if (hasDB) actors.push('Data exfiltration groups targeting exposed databases');
    if (hasRDP) actors.push('Ransomware operators exploiting RDP access');
    if (actors.length === 0) actors.push('Low-level reconnaissance actors');
    return actors;
  }

  async runScan(type: string = 'full', portLimit = 100, cveLimit: 'lite' | 'full' = 'full'): Promise<ScanResult> {
    switch (type) {
      case 'subdomain': return this.runSubdomainOnly();
      case 'port': return this.runPortOnly(portLimit);
      case 'cve': return this.runCVEOnly(portLimit, cveLimit);
      case 'cloud': return this.runCloudOnly();
      default: return this.runFullScan(portLimit, cveLimit);
    }
  }

  async runSubdomainOnly(): Promise<ScanResult> {
    const start = Date.now();
    const subdomainIps = await this.enumerateSubdomains();
    this.scanResult.assets = [];
    this.scanResult.cloudAssets = [];
    this.scanResult.durationSeconds = (Date.now() - start) / 1000;
    this.scanResult.statistics = { totalSubdomains: Object.keys(subdomainIps).length, totalAssets: 0, totalCloudAssets: 0, criticalFindings: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0, infoCount: 0, totalCVEs: 0, totalWebVulns: 0, sslIssues: 0 };
    this.scanResult.executiveSummary = { overallRisk: 'LOW', riskScore: 0, criticalFindings: 0, attackSurfaceSize: Object.keys(subdomainIps).length, recommendations: ['Run port scan for deeper analysis'], threatActors: ['None identified'] };
    return this.scanResult;
  }

  async runPortOnly(portLimit = 50): Promise<ScanResult> {
    const start = Date.now();
    const subdomainIps = await this.enumerateSubdomains();
    const assets = await this.scanPortsOnAssets(subdomainIps, TOP_PORTS.slice(0, portLimit));
    this.scanResult.assets = assets;
    this.scanResult.cloudAssets = [];
    this.scanResult.durationSeconds = (Date.now() - start) / 1000;
    this.scanResult.statistics = { totalSubdomains: Object.keys(subdomainIps).length, totalAssets: assets.length, totalCloudAssets: 0, criticalFindings: 0, highRiskCount: 0, mediumRiskCount: 0, lowRiskCount: 0, infoCount: 0, totalCVEs: 0, totalWebVulns: 0, sslIssues: 0 };
    this.scanResult.executiveSummary = { overallRisk: 'LOW', riskScore: 0, criticalFindings: 0, attackSurfaceSize: assets.length, recommendations: ['Run full scan for CVE and cloud checks'], threatActors: ['None identified'] };
    return this.scanResult;
  }

  async runCVEOnly(portLimit = 50, cveLimit: 'lite' | 'full' = 'full'): Promise<ScanResult> {
    const start = Date.now();
    const [subdomainIps, dnsInfo] = await Promise.all([this.enumerateSubdomains(), this.scanDNS()]);
    const assets = await this.scanPortsOnAssets(subdomainIps, TOP_PORTS.slice(0, portLimit));
    await this.analyzeWebAssets(assets, cveLimit);
    this.dedupeFindings(assets);
    this.calculateRiskScores(assets, []);
    const crit = assets.filter((a) => a.riskScore >= 70).length;
    const totalCves = assets.reduce((sum, a) => sum + a.cves.length, 0);
    const totalWebVulns = assets.reduce((sum, a) => sum + (a.webVulns?.length || 0), 0);
    const sslIssues = assets.filter((a) => a.sslGrade && ['D','E','F','T','X'].includes(a.sslGrade)).length;
    this.scanResult.assets = assets;
    this.scanResult.cloudAssets = [];
    this.scanResult.durationSeconds = (Date.now() - start) / 1000;
    this.scanResult.statistics = {
      totalSubdomains: Object.keys(subdomainIps).length, totalAssets: assets.length, totalCloudAssets: 0,
      criticalFindings: crit, highRiskCount: assets.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length,
      mediumRiskCount: assets.filter((a) => a.riskScore >= 15 && a.riskScore < 40).length,
      lowRiskCount: assets.filter((a) => a.riskScore < 15).length, infoCount: 0,
      totalCVEs: totalCves, totalWebVulns: totalWebVulns, sslIssues,
    };
    this.scanResult.executiveSummary = {
      overallRisk: crit > 0 ? 'CRITICAL' : assets.some((a) => a.riskScore >= 70) ? 'HIGH' : assets.some((a) => a.riskScore >= 40) ? 'MEDIUM' : 'LOW',
      riskScore: crit > 0 ? 90 : Math.max(...assets.map((a) => a.riskScore), 0),
      criticalFindings: crit, attackSurfaceSize: assets.length,
      recommendations: this.generateRecommendations(assets, [], dnsInfo),
      threatActors: this.generateThreatActors(assets),
    };
    return this.scanResult;
  }

  async runCloudOnly(): Promise<ScanResult> {
    const start = Date.now();
    const cloudAssets = await this.scanCloudInfrastructure();
    const dnsFindings = await this.scanDNS();
    this.scanResult.assets = [];
    this.scanResult.cloudAssets = cloudAssets;
    this.scanResult.durationSeconds = (Date.now() - start) / 1000;
    this.scanResult.statistics = { totalSubdomains: 0, totalAssets: 0, totalCloudAssets: cloudAssets.length, criticalFindings: cloudAssets.filter((a) => a.severity === 'critical').length, highRiskCount: cloudAssets.filter((a) => a.severity === 'high').length, mediumRiskCount: cloudAssets.filter((a) => a.severity === 'medium').length, lowRiskCount: 0, infoCount: 0, totalCVEs: 0, totalWebVulns: 0, sslIssues: 0 };
    this.scanResult.executiveSummary = {
      overallRisk: cloudAssets.some((a) => a.severity === 'critical') ? 'CRITICAL' : cloudAssets.some((a) => a.severity === 'high') ? 'HIGH' : 'LOW',
      riskScore: cloudAssets.filter((a) => a.severity === 'critical').length * 25,
      criticalFindings: cloudAssets.filter((a) => a.severity === 'critical').length, attackSurfaceSize: cloudAssets.length,
      recommendations: this.generateRecommendations([], cloudAssets, dnsFindings),
      threatActors: ['Cloud-focused threat actors', 'Data exfiltration groups'],
    };
    return this.scanResult;
  }

  async runFullScan(portLimit = 100, cveLimit: 'lite' | 'full' = 'full'): Promise<ScanResult> {
    const start = Date.now();
    const [subdomainIps, dnsInfo] = await Promise.all([this.enumerateSubdomains(), this.scanDNS()]);
    const assets = await this.scanPortsOnAssets(subdomainIps, TOP_PORTS.slice(0, portLimit));
    const cloudAssets = await this.scanCloudInfrastructure();
    await this.analyzeWebAssets(assets, cveLimit);
    this.dedupeFindings(assets);
    this.calculateRiskScores(assets, cloudAssets);
    const duration = (Date.now() - start) / 1000;
    const crit = assets.filter((a) => a.riskScore >= 70).length + cloudAssets.filter((a) => a.severity === 'critical').length;
    const totalCves = assets.reduce((sum, a) => sum + a.cves.length, 0);
    const totalWebVulns = assets.reduce((sum, a) => sum + (a.webVulns?.length || 0), 0);
    const sslIssues = assets.filter((a) => a.sslGrade && ['D','E','F','T','X'].includes(a.sslGrade)).length;
    this.scanResult.assets = assets;
    this.scanResult.cloudAssets = cloudAssets;
    this.scanResult.dnsAnalysis = dnsInfo;
    this.scanResult.completedAt = new Date().toISOString();
    this.scanResult.durationSeconds = duration;
    this.scanResult.statistics = {
      totalSubdomains: Object.keys(subdomainIps).length, totalAssets: assets.length, totalCloudAssets: cloudAssets.length,
      criticalFindings: crit, highRiskCount: assets.filter((a) => a.riskScore >= 40 && a.riskScore < 70).length,
      mediumRiskCount: assets.filter((a) => a.riskScore >= 15 && a.riskScore < 40).length,
      lowRiskCount: assets.filter((a) => a.riskScore < 15).length,
      infoCount: assets.reduce((sum, a) => sum + a.findings.filter((f) => f.severity === 'info').length, 0),
      totalCVEs: totalCves, totalWebVulns: totalWebVulns, sslIssues,
    };
    this.scanResult.executiveSummary = {
      overallRisk: crit > 0 ? 'CRITICAL' : assets.some((a) => a.riskScore >= 70) ? 'HIGH' : assets.some((a) => a.riskScore >= 40) ? 'MEDIUM' : 'LOW',
      riskScore: Math.min(Math.max(...assets.map((a) => a.riskScore), ...cloudAssets.map((a) => a.riskScore), 0), 100),
      criticalFindings: crit, attackSurfaceSize: Object.keys(subdomainIps).length + cloudAssets.length,
      recommendations: this.generateRecommendations(assets, cloudAssets, dnsInfo),
      threatActors: this.generateThreatActors(assets),
    };
    return this.scanResult;
  }
}
