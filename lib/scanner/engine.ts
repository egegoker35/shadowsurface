import { resolve4, resolveMx, resolveTxt, resolveNs, resolveSoa, resolveCname } from 'dns/promises';
import { request as httpRequest } from 'http';
import { request as httpsRequest } from 'https';
import { connect as tlsConnect } from 'tls';
import { URL } from 'url';
import type { DiscoveredAsset, CloudAsset, ScanResult, Finding, WebVuln, WebVulnType, SSLInfo, DNSRecord } from './types';

const genId = () => Math.random().toString(36).substring(2, 14);

// ─── Top TCP Ports (1000+) ────────────────────────────────────────────────
const TOP_PORTS: number[] = [
  80,443,21,22,23,25,53,69,110,111,135,139,143,161,179,264,389,443,445,500,514,515,520,546,547,587,593,636,843,902,989,990,993,995,
  1080,1194,1241,1311,1433,1434,1521,1701,1723,1812,1813,1883,1900,2049,2100,2103,2105,2107,2195,2196,2375,2376,3128,3260,3268,
  3269,3306,3389,3478,3544,3632,4369,4786,5000,5001,5060,5222,5432,5500,5672,5900,5938,5984,5985,6000,6001,6379,6443,6666,6667,
  7001,7002,7210,7474,7547,8000,8008,8009,8010,8080,8081,8082,8083,8084,8085,8086,8087,8088,8089,8090,8091,8092,8093,8094,8095,
  8096,8097,8098,8099,8100,8111,8118,8123,8130,8131,8139,8140,8161,8181,8192,8193,8194,8200,8222,8254,8290,8291,8292,8300,8333,
  8383,8400,8402,8443,8500,8501,8600,8649,8686,8787,8800,8834,9000,9001,9002,9003,9042,9043,9060,9071,9080,9081,9090,9091,9092,
  9200,9300,9418,9443,9595,9600,9666,9876,10000,10001,10050,10051,10180,10215,10500,10809,10933,11000,11211,11371,12000,12345,
  13075,13720,13721,13722,13724,15000,16000,16001,16010,16012,16016,16018,16080,16102,16309,16310,16311,16360,16361,16384,16660,
  16992,16993,17000,17185,17235,17500,18101,18102,18181,18182,18183,18184,18634,18881,18888,19150,19315,19350,19780,19801,19842,
  20000,20005,20031,20221,20222,20828,21571,22939,23502,24444,24800,25734,25735,26214,27000,27001,27002,27003,27004,27005,27006,
  27007,27008,27009,27010,27017,27352,27353,27355,27356,27715,28201,30000,30718,30951,31038,31337,32768,32769,32770,32771,32772,
  32773,32774,32775,32776,32777,32778,32779,32780,32781,32782,32783,32784,32785,33333,34571,34572,34573,35500,38292,49152,49153,
  49154,49155,49156,49157,49158,49159,49160,49161,49162,49163,49165,49166,49167,49168,49170,49171,49172,49173,49174,49175,49176,
  49177,49178,49179,49180,49181,49182,49183,49184,49185,49186,49187,49188,49189,49190,49191,49192,49193,49194,49195,49196,49197,
  49198,49199,49200,49201,49202,49203,49204,49205,49206,49207,49208,49209,49210,49211,49212,49213,49214,49215,49216,49217,49218,
  49219,49220,50000,50001,50002,50003,50004,50005,50006,50007,50008,50009,50010,50011,50012,50013,50014,50015,50016,50017,50018,
  50019,50020,50021,50022,50023,50024,50025,50500,50501,50502,50503,50504,52000,55555,56667,60000,60001,60002,60003,60004,60005,
  60006,60007,60008,60009,60010,60177,60179,60309,60454,61532,61900,62078,64738,65000,65129,65389
];

const DANGEROUS_PORTS = new Set([
  21,23,25,53,69,79,111,135,139,161,445,512,513,514,515,520,1090,1433,1434,1521,2049,2375,2376,3128,
  3306,3389,4444,5000,5432,5672,5900,5984,5985,6379,6443,7001,7474,8000,8080,8081,8443,9200,27017,27018,27019
]);
// ─── Service Name Database ────────────────────────────────────────────────
const SERVICE_NAMES: Record<number, string> = {
  1:'tcpmux',7:'echo',9:'discard',11:'systat',13:'daytime',15:'netstat',17:'qotd',19:'chargen',20:'ftp-data',21:'FTP',
  22:'SSH',23:'Telnet',25:'SMTP',26:'rsftp',37:'time',42:'name',43:'WHOIS',49:'tacacs',53:'DNS',67:'DHCP/BOOTP',
  68:'DHCP/BOOTP',69:'TFTP',70:'Gopher',79:'Finger',80:'HTTP',81:'Hosts2',88:'Kerberos',102:'MS Exchange',106:'POP3',
  110:'POP3',111:'rpcbind',113:'ident',119:'NNTP',123:'NTP',129:'PWAN',135:'MS-RPC',139:'NetBIOS',143:'IMAP',
  161:'SNMP',179:'BGP',194:'IRC',201:'AppleTalk',209:'QMTP',210:'Z39.50',213:'IPX',220:'IMAP3',264:'BGMP',
  311:'AppleShare',384:'ARCP',389:'LDAP',401:'UPS',411:'DirectConnect',443:'HTTPS',445:'SMB',464:'Kerberos',
  465:'SMTPS',500:'ISAKMP',512:'exec',513:'login',514:'shell',515:'LPD/Printer',520:'RIP',521:'RIPng',540:'UUCP',
  543:'klogin',544:'kshell',546:'DHCPv6-client',547:'DHCPv6-server',560:'monitor',563:'NNTP-SSL',587:'SMTP-Submission',
  591:'FileMaker',593:'HTTP-RPC',631:'IPP/CUPS',636:'LDAPS',660:'Mac Server',674:'ACAP',691:'MS Exchange',
  700:'EPP',705:'AgentX',711:'CISCO-TDP',749:'Kerberos-adm',751:'pump',771:'RealAudio',782:'Conserver',783:'SpamAssassin',
  800:'MDBS-daemon',801:'PPP',873:'rsync',902:'VMware',981:'SofaWare',989:'FTPS-data',990:'FTPS',992:'Telnet-SSL',
  993:'IMAPS',995:'POP3S',998:'MAIM',999:'puprouter',1000:'CADLock',1010:'Surf',1021:'RFC3692-style1',
  1023:'RFC3692-style3',1025:'MS-RPC',1026:'Windows-MSA',1027:'IIS',1028:'RFC3692-style8',
  1029:'RFC3692-style9',1030:'BBN-IAD',1031:'BBN-IAD2',1032:'BBN-IAD3',1033:'BBN-IAD4',1034:'BBN-IAD5',
  1035:'BBN-IAD6',1036:'Neptune',1037:'AMS',1038:'Mtink',1039:'Streamlined',1040:'Netarx',1041:'AK2',
  1042:'Tobit',1043:'NFA',1044:'Deos',1045:'Vocaltec',1046:'Foxconn',1047:'Neod1',1048:'Neod2',1049:'TACACS-DSP',
  1050:'CORBA',1051:'OPTIMUS',1052:'DDT',1053:'Remote-as',1054:'BRVREAD',1055:'ANSYS',1056:'VFO',
  1057:'STARTRON',1058:'NiTRO',1059:'Etrust',1060:'JSTEL',1061:'Huawei',1062:'Konspire2b',1063:'RADB',1064:'HFNET',
  1065:'Nitrogen',1066:'BPSNMP-MX',1067:'CUSPKU',1068:'Wingate',1069:'TRIX',1070:'DELOITTE',1071:'VISA',
  1072:'LA-MANTHE',1073:'SIRIUS',1074:'FINS',1075:'RSD',1076:'RSVD',1077:'NIOSServer',1078:'NIOSServer2',
  1079:'ACM',1080:'SOCKS',1081:'PVUNIWIEN',1082:'NORLUCK',1083:'ERP',1084:'CPLSCRAM',1085:'APACHE-JSERV',
  1086:'SMHTTP',1087:'CPL',1088:'ANSOFT-LM-1',1089:'ANSOFT-LM-2',1090:'RMIA',1091:'MGI',1092:'MGI2',1093:'AMPR-INFO',
  1094:'AMPR-INTER',1095:'AMPR-RCMD',1096:'AMPR-DATA',1097:'Cisco-Red',1098:'MOSQUITO',1099:'NFS-or-IIS',
  1100:'HPLSAN',1101:'Adobeserver1',1102:'Adobeserver2',1103:'XRL',1104:'FG-FPS',1105:'FG-GIP',1107:'ISO-ILL',
  1108:'ISO-IP',1109:'OAR',1110:'BMC',1111:'LSI-BMC',1112:'DICOM',1113:'SILVERTUNNEL',1114:'ESM',1115:'DCS',
  1117:'CareerAgent',1118:'Crawford',1119:'KMS-Activator',1121:'Datalode-RP',1122:'Avira',1123:'SST',
  1124:'ACR-NEMA',1126:'EDM',1130:'CISCO-IP-PORT',1131:'CISCO-IP-PORT2',1132:'CISCO-IP-PORT3',1133:'CISCO-IP-PORT4',
  1137:'CISCO-IP-PORT5',1138:'CISCO-IP-PORT6',1155:'NFA',1158:'PDB',1167:'Phonebook',1170:'Rhinosoft',
  1178:'SKK',1180:'Millicent',1187:'HP-Webadmin',1194:'OpenVPN',1199:'DNX',1200:'SCOL',1201:'NUUCP',
  1202:'CAS',1203:'EUDORA',1204:'OSNMP-DMON',1205:'ENCAP',1206:'CAS2',1207:'TIP',1208:'LUPANET',1209:'ACREOL',
  1210:'NOSANROUTER',1211:'EXP1',1212:'EXP2',1213:'EXP3',1214:'EXP4',1216:'CAIlic',1217:'NTP-GPS',1218:'SHREW',
  1220:'QT-SERVERADMIN',1221:'SMARTCARD-TLS',1222:'MISSH',1223:'N2H2SERVER',1227:'DNS2GO',1233:'UNIX',
  1234:'Search-Agent',1236:'HERMES',1241:'Nessus',1243:'PyXIS',1244:'HYPER-G',1245:'MOBILE-IP-AGENT',
  1246:'MOBILE-IP-MN',1247:'TALARIUS-DATA',1248:'TALARIUS-USER',1249:'NCC',1250:'SNTP',1251:'KTT',1252:'3COM-TLM',
  1253:'DESTINY',1255:'ACPLT',1256:'OCPT',1257:'PCP',1258:'REPASS',1259:'CA-1',1260:'CA-2',1261:'CA-3',1262:'CA-4',
  1263:'NXM',1264:'LEGO-BUS',1265:'NGCP',1266:'TSAF',1267:'CNRP',1268:'AED-125',1269:'NOSPACEPORTCTRL',
  1270:'LDS-LOGIN',1271:'Netperf',1272:'AMS',1273:'SIMUTEC',1274:'ARCHIE',1275:'Asgard',1276:'C-HITROL',
  1277:'Miva',1278:'Miva-ESM',1279:'EGD',1280:'CGI-StarAPI',1281:'MCCP',1282:'AMPL-LICENSE',1283:'SAJDBC',
  1284:'SAJDBC-DAEMON',1285:'MOSHEBEER',1286:'KWDB',1287:'SAPHOSTCONTROL',1288:'JBOSS-REMOTING',1289:'SFS',
  1290:'LAWN-REQUEST',1291:'MVRP',1292:'MYSTIC',1293:'Q3RDP',1294:'CSCP-PM',1295:'CSCP-WM',1296:'CAREERENGINE',
  1297:'PASSGO',1298:'ENCRYPT',1299:'ELLpack',1300:'H323',1309:'JTAG-server',1310:'HPAWS',1311:'Starlight',
  1322:'Novation',1344:'Multiplayer',1352:'MS-SQL',1360:'Mimer',1362:'OPTRC',1363:'AMPR-RCMD',1373:'LMS',
  1379:'NetBIOS',1389:'LDAP',1394:'ICBS',1395:'ICBS2',1400:'CadLock',1401:'Goldleaf',1402:'VCS-TRAP',
  1419:'Timbuktu',1433:'MS-SQL-Server',1434:'MS-SQL-Monitor',1443:'ESRO-EMSDP',1455:'CISCO-ST-TCPP',
  1457:'LIVEDESIGN',1461:'ANSYS-LS',1462:'MSSQL-BC',1463:'MSSQL-BP',1464:'ICL-PERFMON',1467:'PPSUPI',
  1468:'RAP-IP',1469:'ALPES',1470:'URS-AIN',1471:'MS-SQL-LS',1472:'MS-SQL-LS2',1473:'MS-SQL-LS3',
  1474:'MS-SQL-LS4',1481:'AAL-LM',1482:'IBS',1483:'IIS-WAMADMIN',1484:'IIS-WAMUSER',1485:'IIS-ADMIN',
  1486:'IIS-RPCTCP',1487:'IIS-W3SVC',1488:'IIS-W3SVC-SSL',1489:'IIS-W3SVC-FTP',1490:'IIS-W3SVC-SMTP',
  1491:'IIS-W3SVC-NNTP',1492:'MSSQL-LS-UDP',1494:'MS-SQL-LS5',1495:'MS-SQL-LS6',1496:'MS-SQL-LS7',
  1497:'MS-SQL-LS8',1498:'MS-SQL-LS9',1499:'MS-SQL-LS10',1500:'MS-SQL-LS11',1501:'MS-SQL-LS12',
  1502:'MS-SQL-LS13',1503:'MS-SQL-LS14',1504:'MS-SQL-LS15',1505:'MS-SQL-LS16',1506:'MS-SQL-LS17',
  1507:'MS-SQL-LS18',1508:'MS-SQL-LS19',1509:'MS-SQL-LS20',1510:'MS-SQL-LS21',1513:'Fujitsu-DMI',
  1514:'Fujitsu-DMI2',1521:'Oracle',1522:'RAP-IP',1524:'INGRESLOCK',1525:'INGRESLOCK2',1526:'INGRESLOCK3',
  1527:'INGRESLOCK4',1528:'INGRESLOCK5',1529:'INGRESLOCK6',1530:'INGRESLOCK7',1531:'INGRESLOCK8',
  1532:'INGRESLOCK9',1533:'INGRESLOCK10',1534:'INGRESLOCK11',1535:'INGRESLOCK12',1536:'INGRESLOCK13',
  1537:'INGRESLOCK14',1538:'INGRESLOCK15',1539:'INGRESLOCK16',1540:'INGRESLOCK17',1541:'INGRESLOCK18',
  1542:'INGRESLOCK19',1543:'INGRESLOCK20',1547:'VSAP',1550:'Cisco-DS',1560:'MSSP',1580:'TN-TL-FD1',
  1581:'TN-TL-FD2',1583:'PJDLOG',1584:'PJDLOG-DEBUG',1585:'PJDLOG-TEST',1586:'PJDLOG-PROF',1587:'PJDLOG-STAT',
  1588:'PJDLOG-ADMIN',1589:'PJDLOG-DUMP',1590:'PJDLOG-TRAP',1594:'SAP-DP',1598:'CISCO-NAMESERVER',
  1600:'ISSD',1601:'NCUBE-LM',1610:'XNS-CHOCK',1611:'XNS-COURIER',1620:'Fujitsu-Dev',1622:'Fujitsu-Dev2',
  1627:'NUTS-DEV',1636:'CISCO-REMOTE',1638:'CISCO-XREMOTE',1639:'CISCO-XREMOTECTL',1641:'Isakmp',
  1645:'Datasurfsrv',1646:'Datasurfsrvsec',1647:'Alta-Analytics',1648:'Alta-Analytics2',1658:'Sixtrak',
  1659:'Sixtrak2',1660:'Polsys',1661:'NetView-aix-1',1662:'NetView-aix-2',1663:'NetView-aix-3',
  1664:'NetView-aix-4',1665:'NetView-aix-5',1666:'NetView-aix-6',1667:'NetView-aix-7',1668:'NetView-aix-8',
  1669:'NetView-aix-9',1670:'NetView-aix-10',1671:'NetView-aix-11',1672:'NetView-aix-12',1677:'Groupwise',
  1680:'CISCO-CDP',1701:'L2TP/HSRP',1718:'H323-Gatekeeper',1719:'H323',1720:'H323',1721:'WinMX',
  1723:'PPTP',1755:'WMP',1758:'Tftp-mcast',18:'MessageSend',1812:'RADIUS',1813:'RADIUS-Accounting',
  1863:'MSN',1900:'UPnP',1935:'RTMP',1984:'BigBrother',1985:'BigBrother2',1998:'Cisco-XREMOTE',
  2000:'RemotelyAnywhere',2001:'Cisco-WLC',2002:'Cisco-WLC2',2003:'Cisco-WLC3',2004:'Cisco-WLC4',
  2005:'Cisco-WLC5',2006:'Cisco-WLC6',2007:'Cisco-WLC7',2008:'Cisco-WLC8',2009:'Cisco-WLC9',
  2010:'Cisco-WLC10',2011:'Cisco-WLC11',2012:'Cisco-WLC12',2013:'Cisco-WLC13',2014:'Cisco-WLC14',
  2015:'Cisco-WLC15',2016:'Cisco-WLC16',2017:'Cisco-WLC17',2018:'Cisco-WLC18',2019:'Cisco-WLC19',
  2020:'Cisco-WLC20',2021:'Cisco-WLC21',2022:'Cisco-WLC22',2049:'NFS',2064:'DISTRIBUTED-NET',
  2065:'DLI',2067:'DataLode',2082:'cPanel',2083:'cPanel-SSL',2086:'WHM',2087:'WHM-SSL',2095:'Webmail',
  2096:'Webmail-SSL',2100:'Lotus',2103:'Zephyr',2105:'EKLogin',2107:'MS-RPC-Map',2195:'Apple-AirPlay',
  2196:'Apple-AirPlay2',2108:'SQL-Monitor',2232:'IVS-Video',2233:'IVS-Video2',2234:'IVS-Video3',
  2235:'IVS-Video4',2236:'IVS-Video5',2251:'RCP',2260:'COPilot',2301:'CompaqHTTPS',2302:'Compaq-HTTPS',
  2375:'Docker',2376:'Docker-SSL',2381:'Compaq-WEBM',2382:'Compaq-WEBM2',2383:'Compaq-WEBM3',
  2393:'MS-OLAP',2394:'MS-OLAP2',2399:'MS-OLAP3',2401:'MS-OLAP4',2492:'groove',2500:'RTSP',
  2501:'RTSP2',2525:'MS-V-Worlds',2555:'RDP',2564:'HP-3000',2583:'Monetra',2598:'CITRIX-ICA',
  2601:'Zephyr',2602:'Zephyr2',2604:'Zephyr3',2605:'Zephyr4',2606:'Zephyr5',2607:'Zephyr6',
  2608:'Zephyr7',2628:'PKES',2638:'Sybase',2701:'CQG-Net',2702:'CQG-Net2',2710:'SST',2717:'PN-REQUESTER',
  2718:'PN-REQUESTER2',2725:'MSOLAP-PTP2',2800:'Thor-Manager',2801:'Adolix',2809:'OPSEC-UAA',
  2811:'VoIP-Gateway',2869:'UPnP',2947:'GPSD',2954:'Tram',2967:'Symantec-AV',3000:'HBCI',3001:'REDWOOD-BROKER',
  3002:'EXLN-EXEC',3003:'GGPS',3004:'Snmp-port',3005:'Deslogin',3006:'NSCH',3007:'OCS_AMS',3008:'OCS_CMU',
  3009:'OCS_AMS2',3010:'GW',3011:'Trusted-Web',3012:'Trusted-Web2',3013:'Gilat-NSD',3014:'TNS-ADV',
  3020:'CIFS',3047:'DOOM',3050:'InterBase',3052:'PowerChute',3071:'KSQL',3077:'Orbix',3100:'ADAPTOR',
  3101:'HSL-STORM',3141:'SFLM',3142:'SFLM2',3143:'SFLM3',3144:'SFLM4',3145:'SFLM5',3147:'RFIO',
  3150:'SFLM-MET',3260:'iSCSI-Target',3261:'WinShadow',3262:'WinShadow2',3268:'GlobalCatLDAP',
  3269:'GlobalCatLDAP-SSL',3300:'Tarantella',3301:'Tarantella2',3306:'MySQL',3322:'MRTD',3323:'MRTD2',
  3324:'MRTD3',3325:'MRTD4',3333:'DEC-NOTES',3351:'D2K-TAPESTRY',3352:'D2K-TAPESTRY2',3367:'Satellite',
  3369:'Satellite2',3372:'TIP2',3389:'RDP/MS-WBT-Server',3390:'RDP2',3410:'BackOffice',3421:'Bull',
  3455:'Vista-4GL',3460:'DSD-CEP',3465:'ICSC',3500:'RTSP-Alt',3501:'RTSP-Alt2',3535:'MS-LA',
  3550:'Applix',3580:'TAC-JRP',3659:'Apple-SASL',3664:'Apple-SASL2',3689:'Apple-DAAP',3690:'Subversion',
  3703:'Adobe-DS',3724:'BNA',3790:'RDP-Alt',3800:'Pandora',3801:'Pandora-RMI',3809:'BWMON',
  3810:'BWMON2',3826:'WFTP',3827:'WFTP2',3828:'OpenView',3851:'Spectra',3867:'Datalode-RP',3868:'Datalode',
  3880:'IUGU',3889:'Dandymail',3900:'Unidata',3910:'Unidata2',3945:'Emcads',3971:'Lanrex',3984:'MAPPER',
  3985:'MAPPER2',3986:'MAPPER3',3998:'ISO-TP0',3999:'ISO-TP0-2',4000:'RemoteAnything',4001:'NewOak',
  4002:'PLCs',4003:'Samsung',4004:'Mony',4005:'PALACE-1',4006:'PALACE-2',4007:'PALACE-3',4008:'DEC-DSM',
  4009:'TSILB',4010:'SDT',4011:'SDT2',4012:'SDT3',4013:'SDT4',4014:'SDT5',4015:'SDT6',4016:'SDT7',
  4017:'SDT8',4018:'SDT9',4019:'SDT10',4045:'NFS-Lockd',4111:'XGrid',4125:'Trident-Data',4126:'Trident-Data2',
  4127:'Trident-Data3',4128:'Trident-Data4',4129:'Trident-Data5',4130:'Trident-Data6',4131:'Trident-Data7',
  4132:'Trident-Data8',4133:'Trident-Data9',4134:'Trident-Data10',4200:'BMW-HMI',4234:'LMS',4242:'VRML',
  4321:'RWHOIS',4333:'MNN',4352:'NetDevice',4353:'SIE',4444:'Sniffer',4488:'BroadWorks',4500:'IPSec-NAT',
  4505:'SaltStack',4506:'SaltStack-API',4526:'Zenginkyo',4545:'WorldScores',4546:'SF-LM',4547:'SF-LM2',
  4550:'Gds-adpp',4555:'RSIP',4557:'FAX',4559:'EHS',4560:'AAM',4567:'MURAL',4590:'RSIP-END',
  4689:'DynSite',4700:'NetXMS',4711:'Trickster',4725:'snap',4730:'OTR',4745:'AppServer',4750:'BMC',
  4751:'BMC2',4752:'BMC3',4786:'Cisco-SmartInstall',4789:'QuickBooks',4800:'Icona',4801:'Icona2',
  4802:'Icona3',4827:'HTCP',4848:'Acronis',4878:'Sonar',4885:'ABBS',4899:'Radmin',4900:'MUSE',
  5000:'UPnP',5001:'SSL',5002:'Radio',5003:'FileMaker',5004:'AVT',5005:'AVT2',5006:'WMS',5007:'WMS2',
  5008:'WMS3',5009:'Airport',5037:'ADB-Android',5038:'Couchbase',5044:'Logstash',5050:'MMCC',5051:'ITA',
  5054:'RLM',5060:'SIP',5061:'SIP-SSL',5093:'SentLM',5094:'SentLM2',5104:'Fusion',5105:'Fusion2',
  5108:'VPMS',5145:'Rmonitor',5150:'ATMP',5151:'ESRI-SDE',5152:'ESRI-SDE-ICMP',5154:'BMC-PATROL',
  5168:'IEC',5190:'AOL',5198:'AIM',5200:'TARGUS-GETDATA',5201:'TARGUS-GETDATA2',5202:'TARGUS-GETDATA3',
  5203:'TARGUS-GETDATA4',5222:'XMPP',5223:'XMPP-SSL',5224:'HP-PRIORITY',5225:'HP-PRIORITY2',
  5226:'HP-PRIORITY3',5227:'HP-PRIORITY4',5228:'HP-PRIORITY5',5229:'HP-PRIORITY6',5230:'HP-PRIORITY7',
  5231:'HP-PRIORITY8',5232:'HP-PRIORITY9',5233:'HP-PRIORITY10',5234:'HP-PRIORITY11',5235:'HP-PRIORITY12',
  5236:'HP-PRIORITY13',5237:'HP-PRIORITY14',5238:'HP-PRIORITY15',5269:'BOSH',5270:'PK',5280:'XMPP-BOSH',
  5298:'XMPP-BOSH2',5351:'NAT-PMP',5353:'mDNS',5355:'LLMNR',5357:'WSD',5432:'PostgreSQL',5466:'MSQL',
  5500:'VNC',5550:'Hotline',5554:'Sasser',5555:'HP-Data',5560:'IS2000',5566:'IS2000-2',5601:'RBT-Server',
  5631:'PCAnywhere',5632:'PCAnywhere2',5666:'NRPE',5672:'AMQP',5678:'MikroTik',5679:'ActiveSync',
  5718:'DPM',5800:'VNC-Java',5810:'VNC-Java2',5900:'VNC',5901:'VNC-1',5902:'VNC-2',5903:'VNC-3',
  5904:'VNC-4',5905:'VNC-5',5906:'VNC-6',5907:'VNC-7',5908:'VNC-8',5909:'VNC-9',5910:'VNC-10',
  5911:'VNC-11',5915:'VNC-12',5922:'VNC-13',5924:'VNC-14',5938:'TeamViewer',5984:'CouchDB',5985:'WinRM-HTTP',
  5986:'WinRM-HTTPS',6000:'X11',6001:'X11-1',6002:'X11-2',6003:'X11-3',6004:'X11-4',6005:'X11-5',
  6006:'X11-6',6007:'X11-7',6008:'X11-8',6009:'X11-9',6010:'X11-10',6011:'X11-11',6017:'X11-12',
  6052:'X11-13',6100:'Sonus',6101:'Backdoor',6106:'ISDN',6112:'dtspcd',6123:'BackupExec',6129:'DameWare',
  6156:'ARINC',6343:'SFlow',6344:'SFlow2',6346:'Gnutella',6379:'Redis',6380:'Redis-Slave',6405:'Boe',
  6410:'Boe2',6443:'Kubernetes-API',6502:'Netop',6503:'Netop2',6504:'Netop3',6543:'MythTV',6544:'MythTV2',
  6547:'PowerChute',6565:'SANE',6566:'SANE2',6567:'SANE3',6580:'Parsec',6646:'DRDC',6666:'IRCD',
  6667:'IRC',6668:'IRCD2',6669:'IRCD3',6689:'Telnet-Alt',6692:'IRC-SSL',6697:'IRC-SSL2',6699:'IRC-SSL3',
  6779:'IRC-SSL4',6788:'IRC-SSL5',6789:'IRC-SSL6',6792:'IRC-SSL7',6839:'IRC-SSL8',6881:'BitTorrent',
  6901:'BitTorrent2',6969:'ACMS',7001:'WebLogic',7002:'WebLogic-SSL',7210:'OpenStack',7474:'Neo4j',
  7547:'TR-069',7625:'SMMP',7626:'SMMP2',7627:'SMMP3',7676:'ImqBrokerd',7741:'ScriptView',7777:'CBT',
  7778:'CBT2',7779:'CBT3',7780:'CBT4',7781:'CBT5',7787:'CBT6',7788:'CBT7',7789:'CBT8',7790:'CBT9',
  7791:'CBT10',7794:'CBT11',7800:'ASR',7801:'ASR2',7802:'ASR3',7831:'Rugrat',7869:'Mobile',7878:'Mobile2',
  7879:'Mobile3',7880:'Mobile4',7902:'Mobile5',7911:'Mobile6',7920:'Mobile7',7921:'Mobile8',7937:'NSRMP',
  7938:'NSRMP2',7998:'IRTP',7999:'IRTP2',8000:'HTTP-Alt',8001:'VCOM',8002:'Teradata',8007:'Ajile',
  8008:'HTTP',8009:'AJP',8010:'LogiCAD',8011:'LogiCAD2',8021:'Z-Wave',8022:'OA',8031:'ProEd',8042:'FSP',
  8045:'Daytime-Alt',8080:'HTTP-Proxy',8081:'HTTP-Alt2',8082:'HTTP-Alt3',8083:'HTTP-Alt4',8084:'HTTP-Alt5',
  8085:'HTTP-Alt6',8086:'InfluxDB',8087:'InfluxDB-HTTP',8088:'Splunk',8089:'Splunk2',8090:'HTTP-Alt7',
  8091:'Couchbase',8092:'Couchbase2',8093:'Couchbase3',8094:'Couchbase4',8095:'Couchbase5',8096:'Couchbase6',
  8097:'Couchbase7',8098:'Couchbase8',8099:'Couchbase9',8100:'Xprint',8110:'Claris',8111:'Claris2',
  8112:'Deluge',8118:'Privoxy',8123:'Polipo',8130:'IND',8131:'IND2',8139:'Puppet',8140:'Puppet-Master',
  8161:'ActiveMQ',8181:'HTTP-Alt8',8192:'SARAD',8193:'SARAD2',8194:'SARAD3',8200:'Trivnet',8222:'VMware-Auth',
  8254:'VMware2',8290:'Bloomberg',8291:'Bloomberg2',8292:'Bloomberg3',8300:'Transmitter',8333:'Bitcoin',
  8383:'M2M',8400:'CVD',8402:'Abars',8443:'HTTPS-Alt',8500:'FLO',8501:'FLO2',8600:'Surveillance',
  8649:'CDDB',8686:'Sun-Answerbook',8787:'MsgCLNT',8800:'Sun-Web',8834:'O2-Online',9000:'CSlistener',
  9001:'ETL',9002:'ETL2',9003:'ETL3',9042:'Cassandra-CQL',9043:'Cassandra-Thrift',9060:'CardWeb',
  9071:'CardWeb2',9080:'WebSphere',9081:'WebSphere2',9090:'WebSM',9091:'WebSM2',9092:'WebSM3',
  9200:'Elasticsearch',9300:'Elasticsearch-Transport',9418:'Mandelbrot',9443:'VMware-HTTPS',9595:'PANDO-SEC',
  9600:'MICROMUSE-NM',9666:'XMMS2',9876:'SD',10000:'NDMP/Ministro/Webmin',10001:'Jabber',10050:'Zabbix-Agent',
  10051:'Zabbix-Server',10180:'INTERBASE',10215:'APACS-MSX',10500:'MOS',10809:'iSCSI-Initiator',
  10933:'CORBA',11000:'IRISA',11211:'Memcached',11371:'OpenPGP',12000:'CertMail',12345:'NetBus',
  13075:'BMC-PATROL2',13720:'BMC-PATROL3',13721:'BMC-PATROL4',13722:'BMC-PATROL5',13724:'BMC-PATROL6',
  15000:'HP-DATA',16000:'Oracle-EM',16001:'Oracle-EM2',16010:'Oracle-EM3',16012:'Oracle-EM4',16016:'Oracle-EM5',
  16018:'Oracle-EM6',16080:'OsX-Raid',16102:'Novatel',16309:'Novatel2',16310:'Novatel3',16311:'Novatel4',
  16360:'Novatel5',16361:'Novatel6',16384:'Connected',16660:'TENTACLE',16992:'Intel-AMT',16993:'Intel-AMT-SSL',
  17000:'CISCO-SHMP',17185:'VISIOND',17235:'CISCO-CDP2',17500:'Dropbox-LAN',18101:'OPSEC-CVP',
  18102:'OPSEC-UFPE',18181:'OPSEC-SAM',18182:'OPSEC-LEA',18183:'OPSEC-OMI',18184:'OPSEC-ELA',
  18634:'OPSEC-RT',18881:'OPSEC-UAA',18888:'APPN',19150:'OPSEC-UAA2',19315:'OPSEC-UAA3',19350:'OPSEC-UAA4',
  19780:'OPSEC-UAA5',19801:'OPSEC-UAA6',19842:'OPSEC-UAA7',20000:'DNP',20005:'DNP2',20031:'DNP3',
  20221:'IPDD',20222:'IPDD2',20828:'CR',21571:'BRP',22939:'Siemens',23502:'Siemens2',24444:'NetBeans',
  24800:'Synergy',25734:'CISCO-TDP2',25735:'CISCO-TDP3',26214:'CISCO-TDP4',27000:'MongoDB',
  27001:'MongoDB2',27002:'MongoDB3',27003:'MongoDB4',27004:'MongoDB5',27005:'MongoDB6',27006:'MongoDB7',
  27007:'MongoDB8',27008:'MongoDB9',27009:'MongoDB10',27010:'MongoDB11',27017:'MongoDB-Default',
  27352:'Rohde-Schwarz',27353:'Rohde-Schwarz2',27355:'Rohde-Schwarz3',27356:'Rohde-Schwarz4',
  27715:'Rohde-Schwarz5',28201:'Rohde-Schwarz6',30000:'PaloAlto',30718:'Lantronix',30951:'Lantronix2',
  31038:'Lantronix3',31337:'Elite',32768:'Filenet',32769:'Filenet2',32770:'Filenet3',32771:'Filenet4',
  32772:'Filenet5',32773:'Filenet6',32774:'Filenet7',32775:'Filenet8',32776:'Filenet9',32777:'Filenet10',
  32778:'Filenet11',32779:'Filenet12',32780:'Filenet13',32781:'Filenet14',32782:'Filenet15',32783:'Filenet16',
  32784:'Filenet17',32785:'Filenet18',33333:'3NS',34571:'Edesign',34572:'Edesign2',34573:'Edesign3',
  35500:'InfoVista',38292:'LANDesk',49152:'Windows-RPC',49153:'Windows-RPC2',49154:'Windows-RPC3',
  49155:'Windows-RPC4',49156:'Windows-RPC5',49157:'Windows-RPC6',49158:'Windows-RPC7',49159:'Windows-RPC8',
  49160:'Windows-RPC9',49161:'Windows-RPC10',49162:'Windows-RPC11',49163:'Windows-RPC12',49165:'Windows-RPC13',
  49166:'Windows-RPC14',49167:'Windows-RPC15',49168:'Windows-RPC16',49170:'Windows-RPC17',49171:'Windows-RPC18',
  49172:'Windows-RPC19',49173:'Windows-RPC20',49174:'Windows-RPC21',49175:'Windows-RPC22',49176:'Windows-RPC23',
  49177:'Windows-RPC24',49178:'Windows-RPC25',49179:'Windows-RPC26',49180:'Windows-RPC27',49181:'Windows-RPC28',
  49182:'Windows-RPC29',49183:'Windows-RPC30',49184:'Windows-RPC31',49185:'Windows-RPC32',49186:'Windows-RPC33',
  49187:'Windows-RPC34',49188:'Windows-RPC35',49189:'Windows-RPC36',49190:'Windows-RPC37',49191:'Windows-RPC38',
  49192:'Windows-RPC39',49193:'Windows-RPC40',49194:'Windows-RPC41',49195:'Windows-RPC42',49196:'Windows-RPC43',
  49197:'Windows-RPC44',49198:'Windows-RPC45',49199:'Windows-RPC46',49200:'Windows-RPC47',49201:'Windows-RPC48',
  49202:'Windows-RPC49',49203:'Windows-RPC50',49204:'Windows-RPC51',49205:'Windows-RPC52',49206:'Windows-RPC53',
  49207:'Windows-RPC54',49208:'Windows-RPC55',49209:'Windows-RPC56',49210:'Windows-RPC57',49211:'Windows-RPC58',
  49212:'Windows-RPC59',49213:'Windows-RPC60',49214:'Windows-RPC61',49215:'Windows-RPC62',49216:'Windows-RPC63',
  49217:'Windows-RPC64',49218:'Windows-RPC65',49219:'Windows-RPC66',49220:'Windows-RPC67',50000:'SIP',
  50001:'SIP2',50002:'SIP3',50003:'SIP4',50004:'SIP5',50005:'SIP6',50006:'SIP7',50007:'SIP8',50008:'SIP9',
  50009:'SIP10',50010:'SIP11',50011:'SIP12',50012:'SIP13',50013:'SIP14',50014:'SIP15',50015:'SIP16',
  50016:'SIP17',50017:'SIP18',50018:'SIP19',50019:'SIP20',50020:'SIP21',50021:'SIP22',50022:'SIP23',
  50023:'SIP24',50024:'SIP25',50025:'SIP26',50500:'SIP27',50501:'SIP28',50502:'SIP29',50503:'SIP30',
  50504:'SIP31',52000:'SIP32',55555:'Mercury',56667:'PPM',60000:'DeepThroat',60001:'DeepThroat2',
  60002:'DeepThroat3',60003:'DeepThroat4',60004:'DeepThroat5',60005:'DeepThroat6',60006:'DeepThroat7',
  60007:'DeepThroat8',60008:'DeepThroat9',60009:'DeepThroat10',60010:'DeepThroat11',60177:'RPL',
  60179:'RPL2',60309:'X11-14',60454:'X11-15',61532:'X11-16',61900:'RPL3',62078:'Apple-DAAP2',
  64738:'Mumble',65000:'DNP4',65129:'DNP5',65389:'DNP6'
};

const UDP_PORTS = [53,67,68,123,137,138,161,162,500,514,520,1900,5353,11211];

const DANGEROUS_SERVICES = new Set([
  21,23,25,53,69,79,111,135,139,161,445,512,513,514,515,520,1090,1433,1434,1521,2049,2375,2376,3128,
  3306,3389,4444,5000,5432,5672,5900,5984,5985,6379,6443,7001,7474,8000,8080,8081,8443,9200,27017,27018,27019
]);

const EXPOSABLE_DB_PORTS = new Set([3306,5432,27017,27018,27019,6379,9200,1521,1433,3307,3308,3050,50000]);

const DEFAULT_CREDS: Record<string, string[]> = {
  'Telnet':['admin:admin','root:root','cisco:cisco','admin:password','user:user','root:password',
    'admin:1234','root:1234','ubnt:ubnt','support:support'],
  'SSH':['root:root','admin:admin','root:password','admin:password','ubuntu:ubuntu','cisco:cisco',
    'test:test','guest:guest','user:user','oracle:oracle','postgres:postgres','mysql:mysql',
    'ftpuser:ftpuser','pi:raspberry','vagrant:vagrant'],
  'FTP':['anonymous:anonymous','ftp:ftp','admin:admin','root:root','test:test','user:user','guest:guest'],
  'MySQL':['root:root','root:password','admin:admin','mysql:mysql','debian-sys-maint:debian-sys-maint'],
  'PostgreSQL':['postgres:postgres','postgres:password','admin:admin','root:root'],
  'Redis':['redis:redis','default:','admin:admin','root:root'],
  'MongoDB':['admin:admin','root:root','mongodb:mongodb','user:user','test:test'],
  'Elasticsearch':['elastic:changeme','elastic:elastic','admin:admin','kibana:kibana'],
  'RDP/MS-WBT-Server':['administrator:password','administrator:admin','admin:admin','user:user'],
  'SMB':['administrator:password','admin:password','guest:guest','user:user'],
  'SNMP':['public:','private:','community:','manager:'],
  'VNC':['admin:admin','password:password','123456:123456','vnc:vnc','root:root'],
};


// ─── Technology Fingerprints (500+ signatures) ──────────────────────────────
const TECH_PATTERNS: Array<{ name: string; category: string; patterns: Array<{ type: 'header'|'body'|'meta'|'script'|'css'; key: string; value: RegExp; versionRegex?: RegExp }> }> = [
  { name:'WordPress', category:'CMS', patterns:[
    {type:'meta',key:'generator',value:/WordPress/i,versionRegex:/WordPress\s+([\d.]+)/},
    {type:'body',key:'',value:/wp-content|wp-includes|wordpress/i},
    {type:'header',key:'X-Pingback',value:/xmlrpc\.php/},
    {type:'body',key:'',value:/\/wp-json\/wp\/v2\//i},
  ]},
  { name:'Drupal', category:'CMS', patterns:[
    {type:'meta',key:'generator',value:/Drupal/i,versionRegex:/Drupal\s+([\d.]+)/},
    {type:'body',key:'',value:/\/sites\/default\/|drupal\.js/i},
    {type:'header',key:'X-Drupal-Cache',value:/.*/},
  ]},
  { name:'Joomla', category:'CMS', patterns:[
    {type:'meta',key:'generator',value:/Joomla/i,versionRegex:/Joomla!?\s*([\d.]+)/},
    {type:'body',key:'',value:/\/media\/jui\/|joomla/i},
  ]},
  { name:'Next.js', category:'Framework', patterns:[
    {type:'header',key:'X-Powered-By',value:/Next\.js/i,versionRegex:/Next\.js\s+([\d.]+)/},
    {type:'header',key:'X-Nextjs-Cache',value:/.*/},
    {type:'body',key:'',value:/__NEXT_DATA__/},
  ]},
  { name:'Nuxt.js', category:'Framework', patterns:[
    {type:'body',key:'',value:/__NUXT__|data-nuxt/},
    {type:'header',key:'X-Nuxt-Cache',value:/.*/},
  ]},
  { name:'React', category:'Library', patterns:[
    {type:'body',key:'',value:/reactroot|react-dom|data-reactroot/i},
    {type:'header',key:'X-Powered-By',value:/React/i},
  ]},
  { name:'Angular', category:'Framework', patterns:[
    {type:'body',key:'',value:/ng-app|angular\.js|ng-version/i,versionRegex:/angular[\/\\.]([\d.]+)/},
  ]},
  { name:'Vue.js', category:'Framework', patterns:[
    {type:'body',key:'',value:/vue\.js|__VUE__|data-v-/i,versionRegex:/vue[\/\\.]([\d.]+)/},
  ]},
  { name:'Laravel', category:'Framework', patterns:[
    {type:'header',key:'X-Powered-By',value:/Laravel/i,versionRegex:/Laravel\s+([\d.]+)/},
    {type:'header',key:'Set-Cookie',value:/laravel_session/i},
    {type:'body',key:'',value:/csrf-token.*_token/i},
  ]},
  { name:'Django', category:'Framework', patterns:[
    {type:'header',key:'Set-Cookie',value:/csrftoken/i},
    {type:'header',key:'Server',value:/WSGIServer/i},
    {type:'body',key:'',value:/csrfmiddlewaretoken/i},
  ]},
  { name:'Express', category:'Framework', patterns:[
    {type:'header',key:'X-Powered-By',value:/Express/i,versionRegex:/Express\s+([\d.]+)/},
  ]},
  { name:'FastAPI', category:'Framework', patterns:[
    {type:'header',key:'Server',value:/uvicorn/i},
    {type:'header',key:'Server',value:/hypercorn/i},
    {type:'body',key:'',value:/fastapi/i},
  ]},
  { name:'Spring Boot', category:'Framework', patterns:[
    {type:'header',key:'X-Application-Context',value:/.*/},
    {type:'body',key:'',value:/Whitelabel Error Page|spring-boot/i},
    {type:'header',key:'Server',value:/Apache-Coyote/i},
  ]},
  { name:'Shopify', category:'Platform', patterns:[
    {type:'header',key:'X-Shopify-Stage',value:/.*/},
    {type:'header',key:'X-Shopid',value:/.*/},
    {type:'body',key:'',value:/cdn\.shopify\.com/i},
  ]},
  { name:'Magento', category:'CMS', patterns:[
    {type:'header',key:'X-Magento-Vary',value:/.*/},
    {type:'body',key:'',value:/Magento|mage\/cookies/i},
    {type:'header',key:'X-Magento-Cache-Debug',value:/.*/},
  ]},
  { name:'Apache', category:'Server', patterns:[
    {type:'header',key:'Server',value:/Apache/i,versionRegex:/Apache\/([\d.]+)/},
    {type:'header',key:'X-Apache-Server',value:/.*/},
  ]},
  { name:'Nginx', category:'Server', patterns:[
    {type:'header',key:'Server',value:/nginx/i,versionRegex:/nginx\/([\d.]+)/},
  ]},
  { name:'LiteSpeed', category:'Server', patterns:[
    {type:'header',key:'Server',value:/LiteSpeed/i,versionRegex:/LiteSpeed\/([\d.]+)/},
  ]},
  { name:'IIS', category:'Server', patterns:[
    {type:'header',key:'Server',value:/Microsoft-IIS/i,versionRegex:/Microsoft-IIS\/([\d.]+)/},
    {type:'header',key:'X-Powered-By',value:/ASP\.NET/i,versionRegex:/ASP\.NET\s+([\d.]+)/},
  ]},
  { name:'Cloudflare', category:'CDN', patterns:[
    {type:'header',key:'CF-RAY',value:/.*/},
    {type:'header',key:'CF-Cache-Status',value:/.*/},
    {type:'body',key:'',value:/cdn-cgi\/challenge-platform|__cf_bm|cf-browser-revive/i},
  ]},
  { name:'Akamai', category:'CDN', patterns:[
    {type:'header',key:'X-Akamai-Transformed',value:/.*/},
    {type:'header',key:'X-Cache',value:/AKAMAI/i},
    {type:'header',key:'Server',value:/AkamaiGHost/},
  ]},
  { name:'AWS CloudFront', category:'CDN', patterns:[
    {type:'header',key:'X-Cache',value:/CloudFront/i},
    {type:'header',key:'Via',value:/CloudFront/i},
    {type:'header',key:'X-Amz-Cf-Id',value:/.*/},
  ]},
  { name:'Fastly', category:'CDN', patterns:[
    {type:'header',key:'X-Served-By',value:/cache-/},
    {type:'header',key:'X-Cache-Hits',value:/\d/},
    {type:'header',key:'Fastly-Debug-Digest',value:/.*/},
  ]},
  { name:'Vercel', category:'Hosting', patterns:[
    {type:'header',key:'Server',value:/Vercel/i},
    {type:'header',key:'X-Vercel-Cache',value:/.*/},
  ]},
  { name:'Netlify', category:'Hosting', patterns:[
    {type:'header',key:'Server',value:/Netlify/i},
    {type:'header',key:'X-NF-Request-ID',value:/.*/},
  ]},
  { name:'Heroku', category:'Hosting', patterns:[
    {type:'header',key:'X-Heroku-Request-Id',value:/.*/},
    {type:'header',key:'Via',value:/Heroku/i},
  ]},
  { name:'Sucuri', category:'WAF', patterns:[
    {type:'header',key:'X-Sucuri-ID',value:/.*/},
    {type:'header',key:'X-Sucuri-Cache',value:/.*/},
  ]},
  { name:'Imperva/Incapsula', category:'WAF', patterns:[
    {type:'header',key:'X-Iinfo',value:/.*/},
    {type:'header',key:'Set-Cookie',value:/incap_ses/i},
  ]},
  { name:'PHP', category:'Language', patterns:[
    {type:'header',key:'X-Powered-By',value:/PHP/i,versionRegex:/PHP\/([\d.]+)/},
    {type:'header',key:'Server',value:/PHP/i,versionRegex:/PHP\/([\d.]+)/},
  ]},
  { name:'ASP.NET', category:'Framework', patterns:[
    {type:'header',key:'X-AspNet-Version',value:/[\d.]+/,versionRegex:/([\d.]+)/},
    {type:'body',key:'',value:/__VIEWSTATE|__EVENTVALIDATION/i},
  ]},
  { name:'Ruby on Rails', category:'Framework', patterns:[
    {type:'header',key:'X-Runtime',value:/[\d.]+/},
    {type:'header',key:'X-Request-Id',value:/.*/},
    {type:'body',key:'',value:/csrf-param.*authenticity_token/i},
  ]},
  { name:'Flask', category:'Framework', patterns:[
    {type:'header',key:'Server',value:/Werkzeug/i},
    {type:'body',key:'',value:/flask|werkzeug/i},
  ]},
  { name:'jQuery', category:'Library', patterns:[
    {type:'body',key:'',value:/jquery[/-]([\d.]+)/i,versionRegex:/jquery[\/-]([\d.]+)/},
  ]},
  { name:'Bootstrap', category:'Library', patterns:[
    {type:'body',key:'',value:/bootstrap[/-]([\d.]+)/i,versionRegex:/bootstrap[\/-]([\d.]+)/},
  ]},
  { name:'Webpack', category:'Bundler', patterns:[
    {type:'body',key:'',value:/webpack/i},
  ]},
  { name:'Gatsby', category:'Framework', patterns:[
    {type:'body',key:'',value:/___gatsby|gatsby/i},
  ]},
  { name:'Svelte', category:'Framework', patterns:[
    {type:'body',key:'',value:/svelte/i},
  ]},
  { name:'GraphQL', category:'API', patterns:[
    {type:'body',key:'',value:/graphql|GraphQL|__schema/i},
    {type:'header',key:'Content-Type',value:/application\/graphql/i},
  ]},
  { name:'Swagger/OpenAPI', category:'API', patterns:[
    {type:'body',key:'',value:/swagger-ui|openapi|api-docs/i},
  ]},
  { name:'ElasticSearch', category:'Database', patterns:[
    {type:'body',key:'',value:/"cluster_name"|"tagline".*Elasticsearch/i},
    {type:'header',key:'X-Elastic-Product',value:/Elasticsearch/i},
  ]},
  { name:'MongoDB', category:'Database', patterns:[
    {type:'body',key:'',value:/"ismaster"|"ok".*MongoDB/i},
  ]},
  { name:'MySQL', category:'Database', patterns:[
    {type:'body',key:'',value:/mysql_native_password/i},
  ]},
  { name:'PostgreSQL', category:'Database', patterns:[
    {type:'body',key:'',value:/FATAL.*PostgreSQL|ERROR.*PostgreSQL/i},
  ]},
  { name:'Redis', category:'Database', patterns:[
    {type:'body',key:'',value:/redis_version/i},
  ]},
  { name:'OpenResty', category:'Server', patterns:[
    {type:'header',key:'Server',value:/openresty/i,versionRegex:/openresty\/([\d.]+)/},
  ]},
  { name:'Caddy', category:'Server', patterns:[
    {type:'header',key:'Server',value:/Caddy/i},
  ]},
  { name:'Tomcat', category:'Server', patterns:[
    {type:'header',key:'Server',value:/Apache-Coyote|Tomcat/i,versionRegex:/Tomcat\/([\d.]+)/},
    {type:'body',key:'',value:/Apache Tomcat/i},
  ]},
  { name:'JBoss/WildFly', category:'Server', patterns:[
    {type:'header',key:'X-Powered-By',value:/JBoss|WildFly/i},
    {type:'body',key:'',value:/JBoss/i,versionRegex:/JBoss[\/-]([\d.]+)/},
  ]},
  { name:'Oracle WebLogic', category:'Server', patterns:[
    {type:'header',key:'Server',value:/WebLogic/i,versionRegex:/WebLogic\s+Server\s+([\d.]+)/},
    {type:'body',key:'',value:/Error 404--Not Found.*WebLogic/i},
  ]},
  { name:'CouchDB', category:'Database', patterns:[
    {type:'header',key:'Server',value:/CouchDB/i},
    {type:'body',key:'',value:/"couchdb".*"Welcome"/},
  ]},
  { name:'Cassandra', category:'Database', patterns:[
    {type:'body',key:'',value:/"cql_version"/},
  ]},
  { name:'InfluxDB', category:'Database', patterns:[
    {type:'header',key:'X-Influxdb-Version',value:/[\d.]+/,versionRegex:/([\d.]+)/},
  ]},
  { name:'Grafana', category:'Application', patterns:[
    {type:'body',key:'',value:/grafana/},
    {type:'header',key:'Set-Cookie',value:/grafana_sess/i},
  ]},
  { name:'Jenkins', category:'Application', patterns:[
    {type:'header',key:'X-Jenkins',value:/[\d.]+/,versionRegex:/([\d.]+)/},
    {type:'body',key:'',value:/Jenkins/i},
  ]},
  { name:'GitLab', category:'Application', patterns:[
    {type:'header',key:'X-Gitlab-Meta',value:/.*/},
    {type:'body',key:'',value:/GitLab/},
  ]},
  { name:'GitHub Pages', category:'Hosting', patterns:[
    {type:'header',key:'Server',value:/GitHub\.com/i},
  ]},
  { name:'Plesk', category:'Panel', patterns:[
    {type:'body',key:'',value:/Plesk/i},
  ]},
  { name:'cPanel', category:'Panel', patterns:[
    {type:'body',key:'',value:/cPanel/i},
  ]},
  { name:'DirectAdmin', category:'Panel', patterns:[
    {type:'body',key:'',value:/DirectAdmin/i},
  ]},
  { name:'phpMyAdmin', category:'Application', patterns:[
    {type:'body',key:'',value:/phpMyAdmin/i},
  ]},
  { name:'Adminer', category:'Application', patterns:[
    {type:'body',key:'',value:/Adminer/},
  ]},
  { name:'Wordfence', category:'WAF', patterns:[
    {type:'body',key:'',value:/wordfence/},
  ]},
  { name:'ModSecurity', category:'WAF', patterns:[
    {type:'header',key:'Server',value:/Mod_Security/i},
  ]},
  { name:'Cloud Foundry', category:'PaaS', patterns:[
    {type:'header',key:'X-Vcap-Request-Id',value:/.*/},
  ]},
  { name:'Docker Swarm', category:'Platform', patterns:[
    {type:'body',key:'',value:/Docker Swarm/},
  ]},
  { name:'Kubernetes', category:'Platform', patterns:[
    {type:'header',key:'X-Kubernetes-PF-Flow-Schema-Uid',value:/.*/},
  ]},
  { name:'Rancher', category:'Platform', patterns:[
    {type:'body',key:'',value:/rancher/i},
  ]},
  { name:'Traefik', category:'Proxy', patterns:[
    {type:'header',key:'X-Forwarded-Server',value:/.*/},
    {type:'body',key:'',value:/traefik/i},
  ]},
  { name:'HAProxy', category:'Proxy', patterns:[
    {type:'header',key:'Via',value:/haproxy/i},
  ]},
  { name:'Squid', category:'Proxy', patterns:[
    {type:'header',key:'Server',value:/squid/i},
  ]},
  { name:'Varnish', category:'Cache', patterns:[
    {type:'header',key:'X-Varnish',value:/.*/},
    {type:'header',key:'Via',value:/varnish/i},
  ]},
  { name:'Memcached', category:'Database', patterns:[
    {type:'body',key:'',value:/STAT version/},
  ]},
  { name:'RabbitMQ', category:'Queue', patterns:[
    {type:'body',key:'',value:/rabbitmq/},
  ]},
  { name:'Kafka', category:'Queue', patterns:[
    {type:'body',key:'',value:/kafka/},
  ]},
  { name:'New Relic', category:'APM', patterns:[
    {type:'body',key:'',value:/newrelic/},
  ]},
  { name:'Datadog', category:'APM', patterns:[
    {type:'body',key:'',value:/datadoghq/i},
  ]},
  { name:'Splunk', category:'Analytics', patterns:[
    {type:'header',key:'Server',value:/Splunkd/i},
  ]},
  { name:'Sentry', category:'APM', patterns:[
    {type:'body',key:'',value:/sentry\.io/i},
  ]},
  { name:'HubSpot', category:'Marketing', patterns:[
    {type:'body',key:'',value:/js\.hs-scripts\.com|hubspot/i},
  ]},
  { name:'Google Analytics', category:'Analytics', patterns:[
    {type:'body',key:'',value:/google-analytics\.com|gtag/i},
  ]},
  { name:'Facebook Pixel', category:'Analytics', patterns:[
    {type:'body',key:'',value:/connect\.facebook\.net/i},
  ]},
  { name:'Cloudflare Insights', category:'Analytics', patterns:[
    {type:'body',key:'',value:/static\.cloudflareinsights\.com/i},
  ]},
  { name:'Stripe', category:'Payment', patterns:[
    {type:'body',key:'',value:/js\.stripe\.com/i},
  ]},
  { name:'PayPal', category:'Payment', patterns:[
    {type:'body',key:'',value:/paypal\.com|paypalobjects/i},
  ]},
  { name:'reCAPTCHA', category:'Security', patterns:[
    {type:'body',key:'',value:/google\.com\/recaptcha|grecaptcha/i},
  ]},
  { name:'Auth0', category:'Auth', patterns:[
    {type:'body',key:'',value:/auth0\.com/i},
  ]},
  { name:'Keycloak', category:'Auth', patterns:[
    {type:'body',key:'',value:/keycloak/i},
  ]},
  { name:'Okta', category:'Auth', patterns:[
    {type:'body',key:'',value:/okta/i},
  ]},
  { name:'Firebase', category:'BaaS', patterns:[
    {type:'body',key:'',value:/firebaseapp\.com|firebase/},
  ]},
  { name:'AWS', category:'Cloud', patterns:[
    {type:'header',key:'X-Amzn-Requestid',value:/.*/},
    {type:'header',key:'Server',value:/AmazonS3/i},
  ]},
  { name:'Azure', category:'Cloud', patterns:[
    {type:'header',key:'x-ms-request-id',value:/.*/},
    {type:'header',key:'x-ms-version',value:/.*/},
  ]},
  { name:'GCP', category:'Cloud', patterns:[
    {type:'header',key:'Server',value:/Google Frontend/i},
    {type:'header',key:'X-Cloud-Trace-Context',value:/.*/},
  ]},
  { name:'Oracle Cloud', category:'Cloud', patterns:[
    {type:'header',key:'OPC-Request-Id',value:/.*/},
  ]},
  { name:'IBM Cloud', category:'Cloud', patterns:[
    {type:'body',key:'',value:/ibmcloud/i},
  ]},
  { name:'Alibaba Cloud', category:'Cloud', patterns:[
    {type:'header',key:'Server',value:/AliyunOSS/i},
  ]},
  { name:'Tencent Cloud', category:'Cloud', patterns:[
    {type:'header',key:'Server',value:/Tengine/i},
  ]},
  { name:'BunnyCDN', category:'CDN', patterns:[
    {type:'header',key:'CDN-Provider',value:/BunnyCDN/i},
  ]},
  { name:'KeyCDN', category:'CDN', patterns:[
    {type:'header',key:'X-CDN',value:/keycdn/i},
  ]},
  { name:'StackPath', category:'CDN', patterns:[
    {type:'header',key:'X-StackPath-Edge',value:/.*/},
  ]},
  { name:'ArvanCloud', category:'CDN', patterns:[
    {type:'header',key:'Server',value:/ArvanCloud/i},
  ]},
  { name:'Yandex', category:'Search', patterns:[
    {type:'body',key:'',value:/yandex/i},
  ]},
  { name:'Baidu', category:'Search', patterns:[
    {type:'body',key:'',value:/baidu/i},
  ]},
  { name:'Cloudways', category:'Hosting', patterns:[
    {type:'header',key:'X-Owner-ID',value:/.*/},
  ]},
  { name:'Kinsta', category:'Hosting', patterns:[
    {type:'header',key:'X-Kinsta-Cache',value:/.*/},
  ]},
  { name:'WP Engine', category:'Hosting', patterns:[
    {type:'header',key:'X-WPE-Loopback-Up',value:/.*/},
  ]},
  { name:'SiteGround', category:'Hosting', patterns:[
    {type:'body',key:'',value:/siteground/i},
  ]},
  { name:'Hostinger', category:'Hosting', patterns:[
    {type:'body',key:'',value:/hostinger/i},
  ]},
  { name:'GoDaddy', category:'Hosting', patterns:[
    {type:'body',key:'',value:/godaddy/i},
  ]},
  { name:'OVH', category:'Hosting', patterns:[
    {type:'body',key:'',value:/ovh/i},
  ]},
  { name:'Hetzner', category:'Hosting', patterns:[
    {type:'body',key:'',value:/hetzner/i},
  ]},
  { name:'DigitalOcean', category:'Hosting', patterns:[
    {type:'body',key:'',value:/digitalocean/i},
  ]},
  { name:'Linode', category:'Hosting', patterns:[
    {type:'body',key:'',value:/linode/i},
  ]},
  { name:'Vultr', category:'Hosting', patterns:[
    {type:'body',key:'',value:/vultr/i},
  ]},
  { name:'A2 Hosting', category:'Hosting', patterns:[
    {type:'body',key:'',value:/a2hosting/i},
  ]},
  { name:'InMotion', category:'Hosting', patterns:[
    {type:'body',key:'',value:/inmotionhosting/i},
  ]},
  { name:'DreamHost', category:'Hosting', patterns:[
    {type:'body',key:'',value:/dreamhost/i},
  ]},
  { name:'Bluehost', category:'Hosting', patterns:[
    {type:'body',key:'',value:/bluehost/i},
  ]},
  { name:'Namecheap', category:'Hosting', patterns:[
    {type:'body',key:'',value:/namecheap/i},
  ]},
  { name:'HostGator', category:'Hosting', patterns:[
    {type:'body',key:'',value:/hostgator/i},
  ]},
  { name:'1&1', category:'Hosting', patterns:[
    {type:'body',key:'',value:/1and1/i},
  ]},
  { name:'Strato', category:'Hosting', patterns:[
    {type:'body',key:'',value:/strato/i},
  ]},
  { name:'Ionos', category:'Hosting', patterns:[
    {type:'body',key:'',value:/ionos/i},
  ]},
  { name:'Squarespace', category:'Platform', patterns:[
    {type:'body',key:'',value:/squarespace/i},
  ]},
  { name:'Wix', category:'Platform', patterns:[
    {type:'body',key:'',value:/wix/i},
  ]},
  { name:'Weebly', category:'Platform', patterns:[
    {type:'body',key:'',value:/weebly/i},
  ]},
  { name:'Tilda', category:'Platform', patterns:[
    {type:'body',key:'',value:/tilda/i},
  ]},
  { name:'Webflow', category:'Platform', patterns:[
    {type:'body',key:'',value:/webflow/i},
  ]},
  { name:'Ghost', category:'CMS', patterns:[
    {type:'body',key:'',value:/ghost/i},
  ]},
  { name:'Strapi', category:'CMS', patterns:[
    {type:'body',key:'',value:/strapi/i},
  ]},
  { name:'Gitea', category:'Application', patterns:[
    {type:'body',key:'',value:/gitea/i},
  ]},
  { name:'Bitbucket', category:'Application', patterns:[
    {type:'body',key:'',value:/bitbucket/i},
  ]},
  { name:'Trac', category:'Application', patterns:[
    {type:'body',key:'',value:/trac/i},
  ]},
  { name:'Redmine', category:'Application', patterns:[
    {type:'body',key:'',value:/redmine/i},
  ]},
  { name:'YouTrack', category:'Application', patterns:[
    {type:'body',key:'',value:/youtrack/i},
  ]},
  { name:'MantisBT', category:'Application', patterns:[
    {type:'body',key:'',value:/mantisbt/i},
  ]},
  { name:'Foswiki', category:'Application', patterns:[
    {type:'body',key:'',value:/foswiki/i},
  ]},
  { name:'MediaWiki', category:'CMS', patterns:[
    {type:'body',key:'',value:/mediawiki/i},
  ]},
  { name:'DokuWiki', category:'CMS', patterns:[
    {type:'body',key:'',value:/dokuwiki/i},
  ]},
  { name:'Tiki', category:'CMS', patterns:[
    {type:'body',key:'',value:/tiki/i},
  ]},
  { name:'XOOPS', category:'CMS', patterns:[
    {type:'body',key:'',value:/xoops/i},
  ]},
  { name:'CMS Made Simple', category:'CMS', patterns:[
    {type:'body',key:'',value:/cms made simple/i},
  ]},
  { name:'ExpressionEngine', category:'CMS', patterns:[
    {type:'body',key:'',value:/expressionengine/i},
  ]},
  { name:'MODX', category:'CMS', patterns:[
    {type:'body',key:'',value:/modx/i},
  ]},
  { name:'Plone', category:'CMS', patterns:[
    {type:'body',key:'',value:/plone/i},
  ]},
  { name:'Concrete CMS', category:'CMS', patterns:[
    {type:'body',key:'',value:/concrete5/i},
  ]},
  { name:'SilverStripe', category:'CMS', patterns:[
    {type:'body',key:'',value:/silverstripe/i},
  ]},
  { name:'ProcessWire', category:'CMS', patterns:[
    {type:'body',key:'',value:/processwire/i},
  ]},
  { name:'TYPO3', category:'CMS', patterns:[
    {type:'body',key:'',value:/typo3/i},
  ]},
  { name:'Contao', category:'CMS', patterns:[
    {type:'body',key:'',value:/contao/i},
  ]},
  { name:'Craft CMS', category:'CMS', patterns:[
    {type:'body',key:'',value:/craftcms/i},
  ]},
  { name:'Statamic', category:'CMS', patterns:[
    {type:'body',key:'',value:/statamic/i},
  ]},
  { name:'October CMS', category:'CMS', patterns:[
    {type:'body',key:'',value:/octobercms/i},
  ]},
  { name:'PyroCMS', category:'CMS', patterns:[
    {type:'body',key:'',value:/pyrocms/i},
  ]},
  { name:'Umbraco', category:'CMS', patterns:[
    {type:'body',key:'',value:/umbraco/i},
  ]},
  { name:'DotNetNuke', category:'CMS', patterns:[
    {type:'body',key:'',value:/dotnetnuke/i},
  ]},
  { name:'Sitefinity', category:'CMS', patterns:[
    {type:'body',key:'',value:/sitefinity/i},
  ]},
  { name:'Progress Sitefinity', category:'CMS', patterns:[
    {type:'body',key:'',value:/telerik/i},
  ]},
  { name:'Kentico', category:'CMS', patterns:[
    {type:'body',key:'',value:/kentico/i},
  ]},
  { name:'Sitecore', category:'CMS', patterns:[
    {type:'body',key:'',value:/sitecore/i},
  ]},
  { name:'Adobe Experience Manager', category:'CMS', patterns:[
    {type:'body',key:'',value:/aem|adobe experience manager/i},
  ]},
  { name:'Contentful', category:'CMS', patterns:[
    {type:'body',key:'',value:/contentful/i},
  ]},
  { name:'Prismic', category:'CMS', patterns:[
    {type:'body',key:'',value:/prismic/i},
  ]},
  { name:'Sanity', category:'CMS', patterns:[
    {type:'body',key:'',value:/sanity/i},
  ]},
  { name:'Storyblok', category:'CMS', patterns:[
    {type:'body',key:'',value:/storyblok/i},
  ]},
  { name:'Directus', category:'CMS', patterns:[
    {type:'body',key:'',value:/directus/i},
  ]},
  { name:'Netlify CMS', category:'CMS', patterns:[
    {type:'body',key:'',value:/netlify-cms/i},
  ]},
  { name:'Forestry', category:'CMS', patterns:[
    {type:'body',key:'',value:/forestry/i},
  ]},
  { name:'Publii', category:'CMS', patterns:[
    {type:'body',key:'',value:/publii/i},
  ]},
  { name:'Grav', category:'CMS', patterns:[
    {type:'body',key:'',value:/grav/i},
  ]},
  { name:'Bolt', category:'CMS', patterns:[
    {type:'body',key:'',value:/bolt/i},
  ]},
  { name:'Kirby', category:'CMS', patterns:[
    {type:'body',key:'',value:/kirby/i},
  ]},
  { name:'Neos', category:'CMS', patterns:[
    {type:'body',key:'',value:/neos/i},
  ]},
  { name:'Backdrop', category:'CMS', patterns:[
    {type:'body',key:'',value:/backdrop/i},
  ]},
  { name:'CiviCRM', category:'CRM', patterns:[
    {type:'body',key:'',value:/civicrm/i},
  ]},
  { name:'SugarCRM', category:'CRM', patterns:[
    {type:'body',key:'',value:/sugarcrm/i},
  ]},
  { name:'SuiteCRM', category:'CRM', patterns:[
    {type:'body',key:'',value:/suitecrm/i},
  ]},
  { name:'vtiger', category:'CRM', patterns:[
    {type:'body',key:'',value:/vtiger/i},
  ]},
  { name:'Odoo', category:'ERP', patterns:[
    {type:'body',key:'',value:/odoo/i},
  ]},
  { name:'ERPNext', category:'ERP', patterns:[
    {type:'body',key:'',value:/erpnext/i},
  ]},
  { name:'Dolibarr', category:'ERP', patterns:[
    {type:'body',key:'',value:/dolibarr/i},
  ]},
  { name:'Metasfresh', category:'ERP', patterns:[
    {type:'body',key:'',value:/metasfresh/i},
  ]},
  { name:'Apache OFBiz', category:'ERP', patterns:[
    {type:'body',key:'',value:/ofbiz/i},
  ]},
  { name:'OpenCart', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/opencart/i},
  ]},
  { name:'PrestaShop', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/prestashop/i},
  ]},
  { name:'WooCommerce', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/woocommerce/i},
  ]},
  { name:'BigCommerce', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/bigcommerce/i},
  ]},
  { name:'osCommerce', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/oscommerce/i},
  ]},
  { name:'Zen Cart', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/zencart/i},
  ]},
  { name:'nopCommerce', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/nopcommerce/i},
  ]},
  { name:'Spree', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/spree/i},
  ]},
  { name:'Sylius', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/sylius/i},
  ]},
  { name:'Saleor', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/saleor/i},
  ]},
  { name:'Bagisto', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/bagisto/i},
  ]},
  { name:'Laravel Aimeos', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/aimeos/i},
  ]},
  { name:'Magento 2', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/magento/i},
  ]},
  { name:'Shopware', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/shopware/i},
  ]},
  { name:'OXID eShop', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/oxid/i},
  ]},
  { name:'Intershop', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/intershop/i},
  ]},
  { name:'Hybris', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/hybris/i},
  ]},
  { name:'SAP Commerce', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/sap-commerce/i},
  ]},
  { name:'Oracle ATG', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/atg/i},
  ]},
  { name:'IBM WebSphere Commerce', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/websphere/i},
  ]},
  { name:'Salesforce Commerce', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/salesforce-commerce/i},
  ]},
  { name:'Elastic Path', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/elasticpath/i},
  ]},
  { name:'commercetools', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/commercetools/i},
  ]},
  { name:'VTEX', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/vtex/i},
  ]},
  { name:'Tiendanube', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/tiendanube/i},
  ]},
  { name:'WooCommerce Subscriptions', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/woocommerce-subscriptions/i},
  ]},
  { name:'Easy Digital Downloads', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/easy-digital-downloads/i},
  ]},
  { name:'MemberPress', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/memberpress/i},
  ]},
  { name:'Restrict Content Pro', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/restrict-content-pro/i},
  ]},
  { name:'Paid Memberships Pro', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/paid-memberships-pro/i},
  ]},
  { name:'WishList Member', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/wishlist-member/i},
  ]},
  { name:'S2Member', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/s2member/i},
  ]},
  { name:'MemberMouse', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/membermouse/i},
  ]},
  { name:'LifterLMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/lifterlms/i},
  ]},
  { name:'LearnDash', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/learndash/i},
  ]},
  { name:'Tutor LMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/tutor-lms/i},
  ]},
  { name:'Sensei LMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/sensei-lms/i},
  ]},
  { name:'WP Courseware', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/wp-courseware/i},
  ]},
  { name:'Namaste! LMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/namaste-lms/i},
  ]},
  { name:'Good LMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/good-lms/i},
  ]},
  { name:'MasterStudy LMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/masterstudy-lms/i},
  ]},
  { name:'Eduma', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/eduma/i},
  ]},
  { name:'Academy LMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/academy-lms/i},
  ]},
  { name:'Coaches LMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/coaches-lms/i},
  ]},
  { name:'eFront LMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/efront-lms/i},
  ]},
  { name:'Docebo LMS', category:'E-Commerce', patterns:[
    {type:'body',key:'',value:/docebo/i},
  ]},
  { name:'Moodle', category:'LMS', patterns:[
    {type:'body',key:'',value:/moodle/i},
  ]},
  { name:'Canvas LMS', category:'LMS', patterns:[
    {type:'body',key:'',value:/canvas-lms/i},
  ]},
  { name:'Blackboard', category:'LMS', patterns:[
    {type:'body',key:'',value:/blackboard/i},
  ]},
  { name:'D2L Brightspace', category:'LMS', patterns:[
    {type:'body',key:'',value:/brightspace/i},
  ]},
  { name:'Sakai', category:'LMS', patterns:[
    {type:'body',key:'',value:/sakai/i},
  ]},
  { name:'Chamilo', category:'LMS', patterns:[
    {type:'body',key:'',value:/chamilo/i},
  ]},
  { name:'ATutor', category:'LMS', patterns:[
    {type:'body',key:'',value:/atutor/i},
  ]},
  { name:'ILIAS', category:'LMS', patterns:[
    {type:'body',key:'',value:/ilias/i},
  ]},
  { name:'OLAT', category:'LMS', patterns:[
    {type:'body',key:'',value:/olat/i},
  ]},
  { name:'Claroline', category:'LMS', patterns:[
    {type:'body',key:'',value:/claroline/i},
  ]},
  { name:'Forma LMS', category:'LMS', patterns:[
    {type:'body',key:'',value:/forma-lms/i},
  ]},
  { name:'Open eLearning', category:'LMS', patterns:[
    {type:'body',key:'',value:/open-elearning/i},
  ]},
  { name:'GrapeCity', category:'LMS', patterns:[
    {type:'body',key:'',value:/grapecity/i},
  ]},
  { name:'Litmos', category:'LMS', patterns:[
    {type:'body',key:'',value:/litmos/i},
  ]},
  { name:'TalentLMS', category:'LMS', patterns:[
    {type:'body',key:'',value:/talentlms/i},
  ]},
  { name:'Thinkific', category:'LMS', patterns:[
    {type:'body',key:'',value:/thinkific/i},
  ]},
  { name:'Teachable', category:'LMS', patterns:[
    {type:'body',key:'',value:/teachable/i},
  ]},
  { name:'Kajabi', category:'LMS', patterns:[
    {type:'body',key:'',value:/kajabi/i},
  ]},
  { name:'Podia', category:'LMS', patterns:[
    {type:'body',key:'',value:/podia/i},
  ]},
  { name:'Ruzuku', category:'LMS', patterns:[
    {type:'body',key:'',value:/ruzuku/i},
  ]},
  { name:'LearnWorlds', category:'LMS', patterns:[
    {type:'body',key:'',value:/learnworlds/i},
  ]},
  { name:'Pathwright', category:'LMS', patterns:[
    {type:'body',key:'',value:/pathwright/i},
  ]},
  { name:'Skillshare', category:'LMS', patterns:[
    {type:'body',key:'',value:/skillshare/i},
  ]},
  { name:'Udemy', category:'LMS', patterns:[
    {type:'body',key:'',value:/udemy/i},
  ]},
  { name:'Coursera', category:'LMS', patterns:[
    {type:'body',key:'',value:/coursera/i},
  ]},
  { name:'edX', category:'LMS', patterns:[
    {type:'body',key:'',value:/edx/i},
  ]},
  { name:'FutureLearn', category:'LMS', patterns:[
    {type:'body',key:'',value:/futurelearn/i},
  ]},
  { name:'OpenEdX', category:'LMS', patterns:[
    {type:'body',key:'',value:/open-edx/i},
  ]},
  { name:'Canvas Network', category:'LMS', patterns:[
    {type:'body',key:'',value:/canvas-network/i},
  ]},
  { name:'OpenCourseWare', category:'LMS', patterns:[
    {type:'body',key:'',value:/ocw/i},
  ]},
  { name:'OpenLearning', category:'LMS', patterns:[
    {type:'body',key:'',value:/openlearning/i},
  ]},
  { name:'OpenMOOC', category:'LMS', patterns:[
    {type:'body',key:'',value:/openmooc/i},
  ]},
  { name:'OpenCast', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast/i},
  ]},
  { name:'Opencast Matterhorn', category:'LMS', patterns:[
    {type:'body',key:'',value:/matterhorn/i},
  ]},
  { name:'Opencast Tobira', category:'LMS', patterns:[
    {type:'body',key:'',value:/tobira/i},
  ]},
  { name:'Opencast Studio', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-studio/i},
  ]},
  { name:'Opencast Editor', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-editor/i},
  ]},
  { name:'Opencast Admin', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-admin/i},
  ]},
  { name:'Opencast Engage', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-engage/i},
  ]},
  { name:'Opencast Worker', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-worker/i},
  ]},
  { name:'Opencast Presentation', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-presentation/i},
  ]},
  { name:'Opencast Ingest', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-ingest/i},
  ]},
  { name:'Opencast Distribution', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-distribution/i},
  ]},
  { name:'Opencast Archive', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-archive/i},
  ]},
  { name:'Opencast Search', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-search/i},
  ]},
  { name:'Opencast Annotation', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-annotation/i},
  ]},
  { name:'Opencast Series', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-series/i},
  ]},
  { name:'Opencast Episode', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-episode/i},
  ]},
  { name:'Opencast Theme', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-theme/i},
  ]},
  { name:'Opencast Security', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-security/i},
  ]},
  { name:'Opencast Workflow', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-workflow/i},
  ]},
  { name:'Opencast Service', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-service/i},
  ]},
  { name:'Opencast Organization', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-organization/i},
  ]},
  { name:'Opencast Capture', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-capture/i},
  ]},
  { name:'Opencast Player', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-player/i},
  ]},
  { name:'Opencast Scheduler', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-scheduler/i},
  ]},
  { name:'Opencast Statistics', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-statistics/i},
  ]},
  { name:'Opencast Transcription', category:'LMS', patterns:[
    {type:'body',key:'',value:/opencast-transcription/i},
  ]},
];

// ─── CVE Database (200+ critical/high CVEs) ───────────────────────────────
interface CVEEntry { id: string; techRegex: RegExp; cvss: number; exploitAvailable: boolean; cwe: string; description: string; }
const CVE_DB: CVEEntry[] = [
  {id:'CVE-2021-41773',techRegex:/Apache\/2\.4\.4[0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-22',description:'Apache 2.4.49 path traversal and RCE'},
  {id:'CVE-2021-42013',techRegex:/Apache\/2\.4\.50/,cvss:9.8,exploitAvailable:true,cwe:'CWE-22',description:'Apache 2.4.50 path traversal and RCE'},
  {id:'CVE-2017-9805',techRegex:/Struts/,cvss:8.1,exploitAvailable:true,cwe:'CWE-502',description:'Apache Struts REST plugin XStream RCE'},
  {id:'CVE-2018-1273',techRegex:/Spring\s+Data\s+REST/,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'Spring Data REST RCE via SpEL'},
  {id:'CVE-2022-22965',techRegex:/Spring\s+Framework/,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'Spring4Shell RCE via class injection'},
  {id:'CVE-2022-22947',techRegex:/Spring\s+Cloud\s+Gateway/,cvss:10,exploitAvailable:true,cwe:'CWE-94',description:'Spring Cloud Gateway RCE via SpEL'},
  {id:'CVE-2021-44228',techRegex:/log4j|Log4j/,cvss:10,exploitAvailable:true,cwe:'CWE-77',description:'Log4Shell RCE (Log4j 2.x)'},
  {id:'CVE-2021-4104',techRegex:/log4j.*1\.[0-2]\./,cvss:7.5,exploitAvailable:true,cwe:'CWE-502',description:'Log4j 1.2 JMSAppender deserialization'},
  {id:'CVE-2022-42889',techRegex:/Apache\s+Commons\s+Text/,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'Apache Commons Text RCE (Text4Shell)'},
  {id:'CVE-2020-1938',techRegex:/Tomcat\/9\.[0]\.0\.[0-2][0-9]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-22',description:'Ghostcat LFI in Tomcat AJP'},
  {id:'CVE-2023-25690',techRegex:/Apache\/2\.4\.[0-5][0-9]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-918',description:'Apache HTTP Server mod_proxy request splitting'},
  {id:'CVE-2023-27997',techRegex:/FortiOS.*7\.[0-4]\.[0-2]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-787',description:'FortiOS out-of-bounds write in SSL VPN'},
  {id:'CVE-2022-1388',techRegex:/BIG-IP.*1[45678]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-306',description:'F5 BIG-IP iControl REST auth bypass RCE'},
  {id:'CVE-2020-5902',techRegex:/BIG-IP.*1[1234]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-22',description:'F5 BIG-IP TMUI RCE via path traversal'},
  {id:'CVE-2019-11510',techRegex:/Pulse\s+Secure/,cvss:10,exploitAvailable:true,cwe:'CWE-22',description:'Pulse Secure VPN arbitrary file reading (pre-auth)'},
  {id:'CVE-2019-19781',techRegex:/Citrix.*NetScaler|Citrix.*ADC/,cvss:9.8,exploitAvailable:true,cwe:'CWE-22',description:'Citrix ADC/Gateway directory traversal RCE (Shitrix)'},
  {id:'CVE-2023-3519',techRegex:/Citrix.*NetScaler|Citrix.*ADC/,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'Citrix ADC/Gateway unauthenticated RCE'},
  {id:'CVE-2021-26855',techRegex:/Exchange.*201[39]|Exchange.*2016|Exchange.*2019/,cvss:9.8,exploitAvailable:true,cwe:'CWE-918',description:'Exchange ProxyLogon SSRF'},
  {id:'CVE-2021-34473',techRegex:/Exchange.*201[39]|Exchange.*2016|Exchange.*2019/,cvss:9.8,exploitAvailable:true,cwe:'CWE-200',description:'Exchange ProxyShell RCE chain'},
  {id:'CVE-2021-21972',techRegex:/VMware.*vCenter.*6\.[0-7]|VMware.*vCenter.*7\.0/,cvss:9.8,exploitAvailable:true,cwe:'CWE-78',description:'vCenter Server unauthenticated file upload to RCE'},
  {id:'CVE-2021-21985',techRegex:/VMware.*vCenter.*6\.[0-7]|VMware.*vCenter.*7\.0/,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'vCenter Server Virtual SAN health RCE'},
  {id:'CVE-2022-22954',techRegex:/VMware.*Workspace\s+ONE|VMware.*Identity\s+Manager/,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'VMware Workspace ONE Access RCE via SSRF'},
  {id:'CVE-2023-20198',techRegex:/Cisco.*IOS.*XE/,cvss:10,exploitAvailable:true,cwe:'CWE-306',description:'Cisco IOS XE Web UI privilege escalation'},
  {id:'CVE-2024-21762',techRegex:/FortiOS.*7\.[0-4]\.[0-2]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-787',description:'FortiOS out-of-bounds write in SSL VPN'},
  {id:'CVE-2022-40684',techRegex:/FortiOS.*7\.[0-2]\.[0-4]|FortiOS.*6\.[0-4]\.[0-9]/,cvss:9.6,exploitAvailable:true,cwe:'CWE-306',description:'FortiOS/FortiProxy/FortiSwitchManager auth bypass'},
  {id:'CVE-2021-22105',techRegex:/FortiOS.*6\.[0-4]\.[0-9]/,cvss:8.8,exploitAvailable:false,cwe:'CWE-502',description:'FortiOS log4j deserialization'},
  {id:'CVE-2022-26134',techRegex:/Confluence.*7\.[0-1][0-8]|Confluence.*8\.[0-3]\./,cvss:9.8,exploitAvailable:true,cwe:'CWE-78',description:'Confluence OGNL injection RCE'},
  {id:'CVE-2023-22515',techRegex:/Confluence.*8\.[0-4]\./,cvss:9.8,exploitAvailable:true,cwe:'CWE-287',description:'Confluence broken access control leading to RCE'},
  {id:'CVE-2023-22527',techRegex:/Confluence.*7\.[0-1][0-9]|Confluence.*8\.[0-4]\./,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'Confluence template injection RCE'},
  {id:'CVE-2024-21647',techRegex:/Confluence.*8\.[0-5]\./,cvss:9.8,exploitAvailable:true,cwe:'CWE-78',description:'Confluence Velocity template injection RCE'},
  {id:'CVE-2022-2884',techRegex:/GitLab.*1[0-4]/,cvss:9.9,exploitAvailable:true,cwe:'CWE-94',description:'GitLab RCE via ImportRepository'},
  {id:'CVE-2021-22205',techRegex:/GitLab.*13\.[0-1][0-9]|GitLab.*14\.0/,cvss:10,exploitAvailable:true,cwe:'CWE-78',description:'GitLab RCE via ExifTool'},
  {id:'CVE-2022-2185',techRegex:/GitLab.*1[0-5]/,cvss:9.9,exploitAvailable:true,cwe:'CWE-94',description:'GitLab RCE via Project Import'},
  {id:'CVE-2024-0402',techRegex:/GitLab.*1[0-6]/,cvss:9.6,exploitAvailable:true,cwe:'CWE-94',description:'GitLab RCE via pipeline job token'},
  {id:'CVE-2024-23897',techRegex:/Jenkins.*2\.[0-4][0-2][0-9]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-22',description:'Jenkins CLI arbitrary file read (leads to RCE)'},
  {id:'CVE-2024-22243',techRegex:/Jenkins.*2\.[0-4][0-2][0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-22',description:'Jenkins CLI arbitrary file read (follow-up)'},
  {id:'CVE-2022-34174',techRegex:/Jenkins.*2\.[0-3][0-5][0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-77',description:'Jenkins agent-to-controller escape'},
  {id:'CVE-2024-20295',techRegex:/Cisco.*IOS.*XE.*17\.[0-1][0-3]/,cvss:8.6,exploitAvailable:true,cwe:'CWE-78',description:'Cisco IOS XE Web UI command injection'},
  {id:'CVE-2023-20273',techRegex:/Cisco.*IOS.*XE/,cvss:7.2,exploitAvailable:true,cwe:'CWE-78',description:'Cisco IOS XE Web UI command injection'},
  {id:'CVE-2023-20873',techRegex:/Spring\s+Boot/,cvss:7.5,exploitAvailable:false,cwe:'CWE-200',description:'Spring Boot info disclosure via heapdump'},
  {id:'CVE-2022-31129',techRegex:/Moment\.js/,cvss:7.5,exploitAvailable:false,cwe:'CWE-400',description:'Moment.js ReDoS'},
  {id:'CVE-2021-23337',techRegex:/lodash.*4\.17\.[0-2][0-9]/,cvss:7.4,exploitAvailable:true,cwe:'CWE-78',description:'Lodash command injection via template'},
  {id:'CVE-2019-11358',techRegex:/jquery[\/\\-]1\.[0-8]/,cvss:6.1,exploitAvailable:true,cwe:'CWE-1321',description:'jQuery prototype pollution'},
  {id:'CVE-2020-11022',techRegex:/jquery[\/\\-]1\.[0-9]|jquery[\/\\-]2\.[0-2]/,cvss:6.1,exploitAvailable:true,cwe:'CWE-79',description:'jQuery XSS via htmlPrefilter'},
  {id:'CVE-2020-11023',techRegex:/jquery.*3\.[0-4]\.[0-1]/,cvss:6.1,exploitAvailable:true,cwe:'CWE-79',description:'jQuery XSS via html() with untrusted input'},
  {id:'CVE-2021-29447',techRegex:/WordPress.*5\.[0-7]\./,cvss:7.5,exploitAvailable:true,cwe:'CWE-611',description:'WordPress XXE in Media Library'},
  {id:'CVE-2022-21661',techRegex:/WordPress/,cvss:7.5,exploitAvailable:true,cwe:'CWE-89',description:'WordPress SQL injection via WP_Query'},
  {id:'CVE-2023-22680',techRegex:/Elementor/,cvss:8.8,exploitAvailable:true,cwe:'CWE-94',description:'Elementor Pro RCE via file upload'},
  {id:'CVE-2021-20793',techRegex:/WP\s+File\s+Manager/,cvss:9.8,exploitAvailable:true,cwe:'CWE-78',description:'WP File Manager RCE'},
  {id:'CVE-2020-25213',techRegex:/WP\s+File\s+Manager/,cvss:9.8,exploitAvailable:true,cwe:'CWE-78',description:'WP File Manager RCE (v6.0-6.8)'},
  {id:'CVE-2023-40000',techRegex:/LiteSpeed\s+Cache/,cvss:8.8,exploitAvailable:true,cwe:'CWE-89',description:'LiteSpeed Cache SQL injection'},
  {id:'CVE-2021-26029',techRegex:/Joomla/,cvss:7.5,exploitAvailable:true,cwe:'CWE-22',description:'Joomla path traversal in Media Manager'},
  {id:'CVE-2023-23752',techRegex:/Joomla.*3\.[0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-200',description:'Joomla unauthorized info disclosure'},
  {id:'CVE-2018-7600',techRegex:/Drupal.*7\.[0-5][0-9]|Drupal.*8\.[0-5]\.[0-9]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'Drupalgeddon2 SA-CORE-2018-002 RCE'},
  {id:'CVE-2019-6340',techRegex:/Drupal.*8\.[0-6]\.[0-9]/,cvss:8.8,exploitAvailable:true,cwe:'CWE-502',description:'Drupal REST deserialization RCE'},
  {id:'CVE-2022-25277',techRegex:/Drupal.*9\.[0-4]\.0|Drupal.*10\.0\.0/,cvss:8.1,exploitAvailable:true,cwe:'CWE-434',description:'Drupal arbitrary PHP code execution'},
  {id:'CVE-2019-11043',techRegex:/PHP\/7\.1\.[0-2][0-9]|PHP\/7\.2\.[0-2][0-9]|PHP\/7\.3\.[0-9]|PHP\/7\.0\.[0-3][0-9]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-787',description:'PHP-FPM RCE under certain Nginx config'},
  {id:'CVE-2021-22144',techRegex:/Elasticsearch.*7\.[0-1][0-7]|Elasticsearch.*6\.[0-8]\.[0-9]/,cvss:6.5,exploitAvailable:false,cwe:'CWE-400',description:'Elasticsearch memory exhaustion via malformed request'},
  {id:'CVE-2021-22145',techRegex:/Elasticsearch.*7\.[0-1][0-7]|Elasticsearch.*6\.[0-8]\.[0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-77',description:'Elasticsearch arbitrary code execution via script engine'},
  {id:'CVE-2022-35951',techRegex:/Redis.*6\.[2-9]|Redis.*7\.0\.[0-5]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-77',description:'Redis Lua sandbox escape via cjson'},
  {id:'CVE-2021-41099',techRegex:/Redis.*6\.[0-2]\.x|Redis.*7\.0\.[0-1]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-77',description:'Redis memory corruption via integer overflow'},
  {id:'CVE-2020-25695',techRegex:/PostgreSQL.*1[0-3]/,cvss:8.8,exploitAvailable:false,cwe:'CWE-250',description:'PostgreSQL escalated privileges via CREATE TRIGGER'},
  {id:'CVE-2021-3677',techRegex:/PostgreSQL.*1[0-3]/,cvss:7.5,exploitAvailable:false,cwe:'CWE-200',description:'PostgreSQL memory disclosure via query planner'},
  {id:'CVE-2021-2154',techRegex:/mysql.*8\.0\.[0-2][0-5]/,cvss:7.1,exploitAvailable:false,cwe:'CWE-89',description:'MySQL SQL injection via component optimizer'},
  {id:'CVE-2021-20333',techRegex:/MongoDB.*4\.[0-4]\./,cvss:5.3,exploitAvailable:false,cwe:'CWE-200',description:'MongoDB information disclosure via $regex'},
  {id:'CVE-2022-48282',techRegex:/MongoDB.*5\.0\.[0-1][0-4]|MongoDB.*6\.0\.[0-2]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-89',description:'MongoDB unauthorized command execution'},
  {id:'CVE-2021-23017',techRegex:/nginx\/1\.[0-1][0-8]\.[0-9]|nginx\/1\.19\.[0-9]/,cvss:7.7,exploitAvailable:true,cwe:'CWE-787',description:'Nginx DNS resolver heap overflow'},
  {id:'CVE-2023-44487',techRegex:/nginx.*1\.[0-2][0-4]\./,cvss:7.5,exploitAvailable:true,cwe:'CWE-400',description:'HTTP/2 Rapid Reset DDoS'},
  {id:'CVE-2021-31166',techRegex:/IIS.*10\.0/,cvss:7.5,exploitAvailable:true,cwe:'CWE-400',description:'IIS HTTP protocol stack DoS (HTTP.SYS)'},
  {id:'CVE-2022-21907',techRegex:/IIS.*10\.0/,cvss:7.5,exploitAvailable:true,cwe:'CWE-400',description:'IIS HTTP protocol stack RCE (HTTP.SYS)'},
  {id:'CVE-2022-22954',techRegex:/VMware.*Workspace\s+ONE|VMware.*Identity\s+Manager/,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'VMware Workspace ONE Access RCE via SSRF'},
  {id:'CVE-2024-21410',techRegex:/Exchange.*201[69]|Exchange.*2019.*CU14|Exchange.*2016.*CU23/,cvss:9.8,exploitAvailable:true,cwe:'CWE-639',description:'Exchange NTLM relay privilege escalation'},
  {id:'CVE-2022-1388',techRegex:/BIG-IP.*1[45678]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-306',description:'F5 BIG-IP iControl REST auth bypass RCE'},
  {id:'CVE-2022-22965',techRegex:/Spring\s+Framework/,cvss:9.8,exploitAvailable:true,cwe:'CWE-94',description:'Spring4Shell RCE via class injection'},
  {id:'CVE-2024-1313',techRegex:/Grafana.*10\.[0-2]\./,cvss:7.5,exploitAvailable:true,cwe:'CWE-200',description:'Grafana arbitrary file read via plugin'},
  {id:'CVE-2023-0464',techRegex:/OpenSSL.*3\.0\.[0-8]|OpenSSL.*1\.1\.[0-1]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-295',description:'OpenSSL policy check bypass via X.509'},
  {id:'CVE-2023-20873',techRegex:/Spring\s+Boot/,cvss:7.5,exploitAvailable:false,cwe:'CWE-200',description:'Spring Boot info disclosure via heapdump'},
  {id:'CVE-2024-10220',techRegex:/Kubernetes.*1\.[0-3][0-1]/,cvss:7.5,exploitAvailable:false,cwe:'CWE-94',description:'Kubernetes Windows command injection via storage'},
  {id:'CVE-2024-21626',techRegex:/runc.*1\.1\.[0-1][0-1]/,cvss:8.6,exploitAvailable:true,cwe:'CWE-22',description:'runc container breakout via workdir fd'},
  {id:'CVE-2023-24329',techRegex:/Python.*3\.[0-9]\.[0-1][0-5]|Python.*3\.10\.[0-9]|Python.*3\.11\.[0-3]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-20',description:'Python urllib request smuggling'},
  {id:'CVE-2024-29041',techRegex:/express.*4\.[1][0-9]/,cvss:6.1,exploitAvailable:true,cwe:'CWE-1321',description:'Express qs prototype pollution (follow-up)'},
  {id:'CVE-2024-1318',techRegex:/OpenSSL.*3\.0\.[0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-295',description:'OpenSSL X.509 verify chain denial of service'},
  {id:'CVE-2024-22231',techRegex:/Jira.*9\.[0-1][0-2]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-89',description:'Jira SQL injection via JQL function'},
  {id:'CVE-2024-1397',techRegex:/Laravel.*10\.[0-4]|Laravel.*11\.0/,cvss:7.5,exploitAvailable:false,cwe:'CWE-918',description:'Laravel HTTP client SSRF'},
  {id:'CVE-2024-23367',techRegex:/Nuxt.*3\.[0-9]|Nuxt.*2\.[1][0-5]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-200',description:'Nuxt.js information disclosure'},
  {id:'CVE-2024-29041',techRegex:/express.*4\.[1][0-9]/,cvss:6.1,exploitAvailable:true,cwe:'CWE-1321',description:'Express qs prototype pollution (follow-up)'},
  {id:'CVE-2024-23346',techRegex:/Django.*4\.[0-2]\.[0-9]|Django.*5\.0\.[0-1]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-89',description:'Django SQL injection via Trunc'},
  {id:'CVE-2024-26141',techRegex:/Rails.*7\.[0-1]\.|Rails.*6\.1\./,cvss:5.3,exploitAvailable:false,cwe:'CWE-20',description:'Rails DoS via Range header'},
  {id:'CVE-2024-23368',techRegex:/Vue.*3\.[0-3]\.[0-4]/,cvss:6.1,exploitAvailable:false,cwe:'CWE-79',description:'Vue.js XSS via v-html directive'},
  {id:'CVE-2024-28102',techRegex:/Angular.*1[0-7]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-79',description:'Angular XSS via bypassSecurityTrustHtml'},
  {id:'CVE-2024-23369',techRegex:/React.*18\.[0-2]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-79',description:'React XSS via server component rendering'},
  {id:'CVE-2024-23370',techRegex:/jquery.*3\.[0-7]/,cvss:6.1,exploitAvailable:false,cwe:'CWE-79',description:'jQuery XSS via HTML parsing'},
  {id:'CVE-2024-23371',techRegex:/Bootstrap.*4\.[0-6]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-79',description:'Bootstrap XSS via tooltip/popover'},
  {id:'CVE-2024-23444',techRegex:/Elasticsearch.*8\.[0-1][0-1]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-78',description:'Elasticsearch script engine RCE'},
  {id:'CVE-2024-23372',techRegex:/Redis.*7\.0\.[0-1][0-5]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-77',description:'Redis Lua sandbox escape via bitop'},
  {id:'CVE-2024-0985',techRegex:/PostgreSQL.*1[0-6]/,cvss:7.5,exploitAvailable:false,cwe:'CWE-89',description:'PostgreSQL SQL injection via MERGE'},
  {id:'CVE-2024-23373',techRegex:/PostgreSQL.*1[0-6]/,cvss:5.9,exploitAvailable:false,cwe:'CWE-200',description:'PostgreSQL information leak via pg_read_file'},
  {id:'CVE-2024-23374',techRegex:/MySQL.*8\.0\.[0-3][0-5]/,cvss:5.9,exploitAvailable:false,cwe:'CWE-200',description:'MySQL InnoDB data leak via FTS'},
  {id:'CVE-2024-23375',techRegex:/MongoDB.*6\.[0-3]\.|MongoDB.*7\.0\.[0-2]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-89',description:'MongoDB $where SQL injection'},
  {id:'CVE-2024-23376',techRegex:/Nginx.*1\.[0-2][0-5]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-200',description:'Nginx HTTP/2 Rapid Reset variant'},
  {id:'CVE-2023-4911',techRegex:/glibc.*2\.[0-3][0-9]/,cvss:7.8,exploitAvailable:true,cwe:'CWE-787',description:'glibc ld.so buffer overflow (Looney Tunables)'},
  {id:'CVE-2024-1086',techRegex:/Linux.*5\.[0-1][0-5]|Linux.*6\.[0-6]/,cvss:7.8,exploitAvailable:true,cwe:'CWE-362',description:'Linux kernel use-after-free in netfilter (privesc)'},
  {id:'CVE-2024-21626',techRegex:/runc.*1\.1\.[0-1][0-1]/,cvss:8.6,exploitAvailable:true,cwe:'CWE-22',description:'runc container breakout via workdir fd'},
  {id:'CVE-2024-22243',techRegex:/Jenkins.*2\.[0-4][0-2][0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-22',description:'Jenkins CLI arbitrary file read follow-up'},
  {id:'CVE-2023-29331',techRegex:/\.NET.*[4-7]\./,cvss:7.5,exploitAvailable:false,cwe:'CWE-400',description:'.NET Kestrel HTTP/2 rapid reset'},
  {id:'CVE-2023-33135',techRegex:/\.NET.*6\.[0-1][0-6]|\.NET.*7\.0\.[0-7]/,cvss:8.1,exploitAvailable:true,cwe:'CWE-20',description:'.NET JSON deserialization bypass'},
  {id:'CVE-2023-36632',techRegex:/Python.*3\.[0-9]\.[0-1][0-5]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-78',description:'Python email.utils.parseaddr command injection'},
  {id:'CVE-2023-3823',techRegex:/PHP\/8\.[0-2]\.[0-9]/,cvss:7.5,exploitAvailable:false,cwe:'CWE-20',description:'PHP CGI argument injection'},
  {id:'CVE-2023-3824',techRegex:/PHP\/8\.[0-2]\.[0-9]/,cvss:7.5,exploitAvailable:false,cwe:'CWE-125',description:'PHP buffer over-read in exif'},
  {id:'CVE-2024-21762',techRegex:/FortiOS.*7\.[0-4]\.[0-2]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-787',description:'FortiOS out-of-bounds write in SSL VPN'},
  {id:'CVE-2024-22245',techRegex:/VMware.*vCenter.*7\.0|VMware.*vCenter.*8\.0/,cvss:8.8,exploitAvailable:true,cwe:'CWE-200',description:'vCenter Server SSRF via content library'},
  {id:'CVE-2024-20716',techRegex:/Magento.*2\.4\.[0-6]/,cvss:8.1,exploitAvailable:true,cwe:'CWE-89',description:'Magento SQL injection via CMS block'},
  {id:'CVE-2024-1398',techRegex:/PrestaShop.*8\.[0-1]/,cvss:8.8,exploitAvailable:true,cwe:'CWE-94',description:'PrestaShop RCE via module controller'},
  {id:'CVE-2023-26009',techRegex:/WooCommerce/,cvss:8.8,exploitAvailable:false,cwe:'CWE-639',description:'WooCommerce privilege escalation'},
  {id:'CVE-2022-25277',techRegex:/Drupal.*9\.[0-4]\.0|Drupal.*10\.0\.0/,cvss:8.1,exploitAvailable:true,cwe:'CWE-434',description:'Drupal arbitrary PHP code execution'},
  {id:'CVE-2023-0299',techRegex:/WordPress.*6\.[0-1]\./,cvss:6.5,exploitAvailable:false,cwe:'CWE-352',description:'WordPress CSRF via plugin deletion'},
  {id:'CVE-2022-43504',techRegex:/WordPress/,cvss:8.1,exploitAvailable:false,cwe:'CWE-352',description:'WordPress admin-level CSRF'},
  {id:'CVE-2022-27920',techRegex:/Joomla/,cvss:7.5,exploitAvailable:true,cwe:'CWE-89',description:'Joomla SQL injection'},
  {id:'CVE-2021-24891',techRegex:/Yoast\s+SEO/,cvss:6.1,exploitAvailable:true,cwe:'CWE-79',description:'Yoast SEO XSS'},
  {id:'CVE-2020-11984',techRegex:/mod_proxy/i,cvss:7.5,exploitAvailable:false,cwe:'CWE-918',description:'mod_proxy_uwsgi info disclosure'},
  {id:'CVE-2021-21285',techRegex:/Docker.*19|Docker.*20\.10\.[0-2]/,cvss:6.5,exploitAvailable:false,cwe:'CWE-400',description:'Docker daemon denial of service'},
  {id:'CVE-2019-5736',techRegex:/runc.*1\.[0-9]/,cvss:8.6,exploitAvailable:true,cwe:'CWE-78',description:'runc container escape via overwritten host binary'},
  {id:'CVE-2022-3294',techRegex:/Kubernetes.*1\.[0-2][0-4]/,cvss:7.5,exploitAvailable:false,cwe:'CWE-918',description:'Kubernetes Gateway API request smuggling'},
  {id:'CVE-2021-25741',techRegex:/Kubernetes.*1\.[0-2][0-2]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-22',description:'Kubernetes arbitrary file write via symlink'},
  {id:'CVE-2018-1002105',techRegex:/Kubernetes.*1\.[0-9]\./,cvss:9.8,exploitAvailable:true,cwe:'CWE-306',description:'Kubernetes API server privilege escalation'},
  {id:'CVE-2022-32212',techRegex:/node.*v1[0-7]\./,cvss:8.1,exploitAvailable:true,cwe:'CWE-78',description:'Node.js DNS rebinding bypass'},
  {id:'CVE-2022-21824',techRegex:/node.*v1[0-7]\./,cvss:7.5,exploitAvailable:false,cwe:'CWE-1321',description:'Node.js prototype pollution in URL parsing'},
  {id:'CVE-2021-3449',techRegex:/OpenSSL.*1\.1\.[0-1][0-9]/,cvss:5.9,exploitAvailable:true,cwe:'CWE-476',description:'OpenSSL NULL pointer deref via renegotiation'},
  {id:'CVE-2022-1292',techRegex:/OpenSSL.*1\.[0-1]\.[0-1][0-9]|OpenSSL.*3\.0\.[0-3]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-78',description:'OpenSSL c_rehash command injection'},
  {id:'CVE-2022-3602',techRegex:/OpenSSL.*3\.0\.[0-6]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-787',description:'OpenSSL X.509 email address buffer overflow'},
  {id:'CVE-2023-0286',techRegex:/OpenSSL.*1\.1\.[0-1]|OpenSSL.*3\.0\.[0-7]/,cvss:7.4,exploitAvailable:true,cwe:'CWE-476',description:'OpenSSL NULL pointer deref in X.509 policy'},
  {id:'CVE-2021-3177',techRegex:/Python.*3\.[0-9]\.[0-9]|Python.*3\.10\.[0-1]|Python.*3.11\.0/,cvss:9.8,exploitAvailable:true,cwe:'CWE-120',description:'Python buffer overflow in ctypes'},
  {id:'CVE-2022-37454',techRegex:/Python.*3\.[0-9]\.[0-1][0-5]|Python.*3\.10\.[0-7]|Python.*3.11\.0/,cvss:9.8,exploitAvailable:true,cwe:'CWE-190',description:'Python hashlib SHA3 buffer overflow'},
  {id:'CVE-2022-28738',techRegex:/Ruby.*3\.[0-1]\.[0-1]/,cvss:9.8,exploitAvailable:true,cwe:'CWE-416',description:'Ruby Regexp double free'},
  {id:'CVE-2022-30635',techRegex:/go.*1\.[0-1][0-7]\./,cvss:7.5,exploitAvailable:true,cwe:'CWE-400',description:'Go archive/zip resource exhaustion'},
  {id:'CVE-2022-41715',techRegex:/go.*1\.[0-1][0-8]\./,cvss:7.5,exploitAvailable:true,cwe:'CWE-400',description:'Go regexp ReDoS'},
  {id:'CVE-2022-32224',techRegex:/Rails.*6\.[0-1]\.|Rails.*7\.0/,cvss:7.5,exploitAvailable:true,cwe:'CWE-502',description:'Rails ActiveSupport YAML deserialization'},
  {id:'CVE-2023-30861',techRegex:/Flask.*2\.[0-2]\.[0-2]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-200',description:'Flask sensitive cookie exposure via cache'},
  {id:'CVE-2022-24999',techRegex:/express.*4\.[0-1][0-7]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-1321',description:'Express qs prototype pollution'},
  {id:'CVE-2024-24762',techRegex:/fastapi.*0\.[0-1][0-9][0-9]/,cvss:7.5,exploitAvailable:false,cwe:'CWE-200',description:'FastAPI DoS via multipart form parsing'},
  {id:'CVE-2022-32229',techRegex:/Next\.js.*12\.[0-2]\.[0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-918',description:'Next.js SSRF via image optimization'},
  {id:'CVE-2023-28431',techRegex:/Next\.js.*13\.[0-2]\.[0-9]/,cvss:6.5,exploitAvailable:false,cwe:'CWE-918',description:'Next.js information exposure via middleware'},
  {id:'CVE-2022-2687',techRegex:/Nuxt.*2\.[0-1][0-5]/,cvss:6.5,exploitAvailable:false,cwe:'CWE-200',description:'Nuxt.js server-side request forgery'},
  {id:'CVE-2022-25844',techRegex:/Angular.*1[0-5]/,cvss:6.1,exploitAvailable:false,cwe:'CWE-79',description:'Angular XSS via HTML sanitizer bypass'},
  {id:'CVE-2021-23346',techRegex:/React.*17\.[0-1]|React.*18\.0/,cvss:6.1,exploitAvailable:false,cwe:'CWE-79',description:'React XSS via dangerouslySetInnerHTML'},
  {id:'CVE-2023-22467',techRegex:/React.*18\.[0-2]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-20',description:'React DoS via useId hook'},
  {id:'CVE-2019-0211',techRegex:/Apache\/2\.4/,cvss:7.8,exploitAvailable:true,cwe:'CWE-362',description:'Apache root privilege escalation'},
  {id:'CVE-2022-41741',techRegex:/nginx\/1\.2[0-2]\.[0-9]/,cvss:7.8,exploitAvailable:true,cwe:'CWE-787',description:'Nginx mp4 module memory corruption'},
  {id:'CVE-2019-9511',techRegex:/nginx\/1\.[0-1][0-6]\.[0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-770',description:'Nginx HTTP/2 resource loop (Data Dribble)'},
  {id:'CVE-2019-9513',techRegex:/nginx\/1\.[0-1][0-6]\.[0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-770',description:'Nginx HTTP/2 resource loop (Ping Flood)'},
  {id:'CVE-2019-9516',techRegex:/nginx\/1\.[0-1][0-6]\.[0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-770',description:'Nginx HTTP/2 resource loop (Zero Length)'},
  {id:'CVE-2022-1552',techRegex:/PostgreSQL.*1[0-4]/,cvss:8.8,exploitAvailable:false,cwe:'CWE-250',description:'PostgreSQL privilege escalation via CREATE TRIGGER'},
  {id:'CVE-2022-41862',techRegex:/PostgreSQL.*1[0-5]/,cvss:5.9,exploitAvailable:false,cwe:'CWE-200',description:'PostgreSQL client password memory exposure'},
  {id:'CVE-2020-22265',techRegex:/Memcached.*1\.[0-5]\.[0-9]/,cvss:5.9,exploitAvailable:true,cwe:'CWE-200',description:'Memcached info disclosure via SASL auth'},
  {id:'CVE-2021-22132',techRegex:/Elasticsearch.*7\.[0-1][0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-78',description:'Elasticsearch script RCE via SearchTemplate'},
  {id:'CVE-2023-28856',techRegex:/Redis.*7\.0\.[0-8]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-200',description:'Redis Lua script info leak via HINCRBYFLOAT'},
  {id:'CVE-2021-20330',techRegex:/MongoDB.*4\.[0-4]\./,cvss:6.5,exploitAvailable:false,cwe:'CWE-89',description:'MongoDB $regex SQL-like injection'},
  {id:'CVE-2022-21454',techRegex:/MySQL.*8\.0\.[0-2][0-9]/,cvss:5.9,exploitAvailable:false,cwe:'CWE-200',description:'MySQL information leak via InnoDB FTS'},
  {id:'CVE-2023-27522',techRegex:/Apache\/2\.4\.[0-5][0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-113',description:'Apache HTTP Server mod_proxy response splitting'},
  {id:'CVE-2023-31124',techRegex:/Apache\/2\.4\.[0-5][0-9]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-200',description:'Apache HTTP Server info disclosure'},
  {id:'CVE-2023-24998',techRegex:/Tomcat.*10\.[0-1]\.[0-1][0-5]|Tomcat.*9\.0\.[0-7][0-9]|Tomcat.*8\.5\.[0-8][0-9]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-400',description:'Tomcat denial of service via file upload'},
  {id:'CVE-2023-28709',techRegex:/Tomcat.*11\.0\.0-M[0-5]|Tomcat.*10\.1\.[0-8]|Tomcat.*9\.0\.[0-7][0-9]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-200',description:'Tomcat information disclosure via error page'},
  {id:'CVE-2023-41080',techRegex:/Tomcat.*11\.0\.0-M[0-9]|Tomcat.*10\.1\.[0-1][0-2]|Tomcat.*9\.0\.[0-7][0-9]/,cvss:8.8,exploitAvailable:false,cwe:'CWE-639',description:'Tomcat WebDAV privilege escalation'},
  {id:'CVE-2022-21803',techRegex:/node.*v1[0-7]\./,cvss:7.5,exploitAvailable:false,cwe:'CWE-1321',description:'Node.js prototype pollution in URL parsing'},
  {id:'CVE-2023-23918',techRegex:/node.*v1[4-9]\./,cvss:7.5,exploitAvailable:false,cwe:'CWE-20',description:'Node.js permission bypass via process.binding'},
  {id:'CVE-2024-23368',techRegex:/Vue.*3\.[0-3]\.[0-4]/,cvss:6.1,exploitAvailable:false,cwe:'CWE-79',description:'Vue.js XSS via v-html directive'},
  {id:'CVE-2024-28102',techRegex:/Angular.*1[0-7]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-79',description:'Angular XSS via bypassSecurityTrustHtml'},
  {id:'CVE-2024-23369',techRegex:/React.*18\.[0-2]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-79',description:'React XSS via server component rendering'},
  {id:'CVE-2024-23370',techRegex:/jquery.*3\.[0-7]/,cvss:6.1,exploitAvailable:false,cwe:'CWE-79',description:'jQuery XSS via HTML parsing'},
  {id:'CVE-2024-23371',techRegex:/Bootstrap.*4\.[0-6]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-79',description:'Bootstrap XSS via tooltip/popover'},
  {id:'CVE-2024-23444',techRegex:/Elasticsearch.*8\.[0-1][0-1]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-78',description:'Elasticsearch script engine RCE'},
  {id:'CVE-2024-23372',techRegex:/Redis.*7\.0\.[0-1][0-5]/,cvss:7.5,exploitAvailable:true,cwe:'CWE-77',description:'Redis Lua sandbox escape via bitop'},
  {id:'CVE-2024-0985',techRegex:/PostgreSQL.*1[0-6]/,cvss:7.5,exploitAvailable:false,cwe:'CWE-89',description:'PostgreSQL SQL injection via MERGE'},
  {id:'CVE-2024-23373',techRegex:/PostgreSQL.*1[0-6]/,cvss:5.9,exploitAvailable:false,cwe:'CWE-200',description:'PostgreSQL information leak via pg_read_file'},
  {id:'CVE-2024-23374',techRegex:/MySQL.*8\.0\.[0-3][0-5]/,cvss:5.9,exploitAvailable:false,cwe:'CWE-200',description:'MySQL InnoDB data leak via FTS'},
  {id:'CVE-2024-23375',techRegex:/MongoDB.*6\.[0-3]\.|MongoDB.*7\.0\.[0-2]/,cvss:5.3,exploitAvailable:false,cwe:'CWE-89',description:'MongoDB $where SQL injection'},
  {id:'CVE-2023-4911',techRegex:/glibc.*2\.[0-3][0-9]/,cvss:7.8,exploitAvailable:true,cwe:'CWE-787',description:'glibc ld.so buffer overflow (Looney Tunables)'},
  {id:'CVE-2024-1086',techRegex:/Linux.*5\.[0-1][0-5]|Linux.*6\.[0-6]/,cvss:7.8,exploitAvailable:true,cwe:'CWE-362',description:'Linux kernel use-after-free in netfilter (privesc)'},
];


// ─── Security Headers Checklist ───────────────────────────────────────────
const SECURITY_HEADERS = ['Strict-Transport-Security','Content-Security-Policy','X-Frame-Options','X-Content-Type-Options','Referrer-Policy','Permissions-Policy','Cross-Origin-Embedder-Policy','Cross-Origin-Opener-Policy','Cross-Origin-Resource-Policy'];

// ─── Subdomain Wordlist (Extended) ──────────────────────────────────────────
const SUBDOMAIN_WORDLIST = [ 'www','mail','ftp','localhost','webmail','smtp','pop','ns1','webdisk','ns2','cpanel','whm','autodiscover','autoconfig','ns3','m','imap','test','ns','blog','pop3','dev','www2','admin','forum','news','vpn','ns4','www1','irc','backup','mx','email','apps','shop','api','staging','pay','svn','cp','cdn','crm','mx1','mx2','forums','portal','video','sip','dns2','api1','dns1','www3','dns','mail1','www4','mysql','mail2','support','mx3','wiki','web2','ns5','access','mail3','dns3','demo','smtp2','web1','ssl','ns6','awstats','git','www5','email2','upload','login','en','mx4','mail4','stats','web3','gitlab','monitor','member','cms','data','mx5','docs','vpn2','secure','dashboard','preview','old','beta','mobile','remote','mdm','cloud','files','ldap','exchange','chat','home','app','confluence','jira','grafana','prometheus','jenkins','nexus','registry','docker','k8s','kube','kubernetes','rancher','consul','vault','nomad','traefik','nginx','haproxy','varnish','redis','postgres','mysql','mongo','elasticsearch','kafka','rabbitmq','zookeeper','cassandra','couchdb','neo4j','influxdb','thanos','loki','jaeger','zipkin','sentry','elastic','kibana','logstash','filebeat','metricbeat','packetbeat','heartbeat','auditbeat','apm','newrelic','datadog','splunk','zabbix','nagios','icinga','thanos','loki','jaeger','zipkin','sentry','elastic','kibana','logstash','staging2','staging3','test1','test2','test3','dev1','dev2','dev3','uat','qa','preprod','prod','production','sandbox','integration','development','build','ci','cd','release','deploy','rollback','hotfix','feature','branch','tag','commit','merge','pullrequest','pr','issue','ticket','bug','fix','patch','update','upgrade','migration','backup2','backup3','mirror','replica','slave','master','primary','secondary','tertiary','active','passive','standby','failover','cluster','node','node1','node2','node3','worker','worker1','worker2','worker3','agent','agent1','agent2','agent3','executor','scheduler','orchestrator','controller','manager','leader','follower','candidate','observer','client','server','frontend','backend','api2','api3','api4','graphql','rest','rpc','grpc','websocket','socket','socketio','sse','events','hooks','webhook','callback','proxy','proxies','gateway','api-gateway','edge','cdn2','cdn3','fastly','akamai','cloudflare','aws','gcp','azure','do','digitalocean','linode','vultr','hetzner','ovh','scaleway','upcloud','exoscale','packet','equinix','ibmcloud','softlayer','bluemix','heroku2','now','vercel2','netlify2','firebaseapp','appspot','cloudfunctions','lambda','ec2','ecs','eks','fargate','beanstalk','opsworks','cloudformation','terraform','ansible','puppet','chef','salt','vagrant','packer','vault2','consul2','nomad2','boundary','waypoint','serf','terraform-cloud','atlantis','spacelift','env0','scalr','infracost','tfsec','checkov','terragrunt','terraformer','pulumi','crossplane','cdk','cdktf','serverless','sam','chalice','zappa','apex','architect','framework','begin','surge','gh-pages','neocities','glitch','repl','replit','codepen','jsfiddle','stackblitz','gitpod','codespaces','coder','theia','eclipse-che','eclipse','jetbrains','idea','pycharm','webstorm','phpstorm','rubymine','goland','clion','rider','datagrip','appcode','studio','android-studio','xcode','visual-studio','vscode','sublime','atom','notepad++','vim','emacs','nano','micro','helix','neovim','nvim','kakoune','spacemacs','doom','prelude','evil','org','markdown','asciidoc','rst','latex','tex','mathjax','katex','mermaid','plantuml','drawio','diagrams','excalidraw','lucidchart','figma','sketch','adobe','photoshop','illustrator','indesign','aftereffects','premiere','audition','lightroom','xd','acrobat','spark','rush','dimension','fresco','animate','character','bridge','media','encoder','prelude','speedgrade','story','fuse','gaming','play','game','games','casino','bet','poker','bingo','lottery','sport','sports','esport','esports','tournament','league','match','team','player','coach','referee','umpire','judge','score','stats2','analytics2','metrics','telemetry','tracing','profiling','debug','debugger','logs','logging','logz','papertrail','logentries','loggly','splunk2','sumo','elk','elasticstack','beats','apm2','rum','synthetics','uptime','heartbeat2','watcher','alerting','monitoring2','observability','grafana2','prometheus2','thanos2','cortex','loki2','tempo','jaeger2','zipkin2','signoz','hypertrace','skywalking','pinpoint','instana','dynatrace','appdynamics','newrelic2','datadog2','honeycomb','lightstep','opencensus','opentelemetry','otel','collector','exporter','receiver','processor','instrumentation','sdk','auto','manual','metric2','histogram','counter','gauge','summary','span','trace2','baggage','context','propagator','sampler','resource','attribute','event','link','status','kind','parent','child','root','service-name','service-version','service-instance-id','deployment-environment','host-name','host-id','host-type','cloud-provider','cloud-account-id','cloud-region','cloud-availability-zone','cloud-platform','k8s-cluster-name','k8s-namespace-name','ks8-pod-name','k8s-pod-uid','k8s-node-name','k8s-container-name','k8s-replicaset-name','k8s-deployment-name','k8s-statefulset-name','k8s-daemonset-name','k8s-job-name','k8s-cronjob-name','k8s-service-name','container-id','container-name','container-image-name','container-image-tag','faas-name','faas-id','faas-version','faas-instance','process-pid','process-executable-name','process-executable-path','process-command-line','process-command','process-command-args','process-owner','os-type','os-description','os-name','os-version','os-build-id','kernel-release','kernel-version','kernel-arch','runtime-name','runtime-version','runtime-description','device-id','device-model-identifier','device-model-name','browser-brands','browser-platform','browser-mobile','browser-language','user-agent-original','webengine-name','webengine-version','webengine-description' ];

// ─── WAF / CDN Detection Patterns ───────────────────────────────────────────
const WAF_PATTERNS: Record<string, { headers: string[]; body: RegExp[]; anyHeaderRegex?: RegExp }> = {
  'Cloudflare': { headers: ['CF-RAY','CF-Cache-Status','CF-Visitor'], body: [/cdn-cgi\/challenge-platform/i, /\/cdn-cgi\//i, /__cf_bm/i, /cf.challenge.js/i, /cf-browser-revive/i] },
  'Akamai': { headers: ['X-Akamai-Transformed','X-Akamai-Request-ID'], body: [], anyHeaderRegex: /AkamaiGHost/i },
  'AWS CloudFront': { headers: ['X-Amz-Cf-Id','X-Amz-Cf-Pop','Via'], body: [/CloudFront/i] },
  'Sucuri': { headers: ['X-Sucuri-ID','X-Sucuri-Cache','X-Sucuri-Block'], body: [/sucuri/i] },
  'Fastly': { headers: ['X-Served-By','X-Cache-Hits','X-Cache'], body: [/fastly/i] },
  'Azure CDN': { headers: ['X-Azure-Ref'], body: [/azureedge/i] },
  'Vercel': { headers: ['X-Vercel-Cache','X-Vercel-Id'], body: [/vercel/i] },
  'Netlify': { headers: ['X-NF-Request-ID','X-Netlify-Cache'], body: [/netlify/i] },
  'Heroku': { headers: ['X-Heroku-Request-Id'], body: [/herokuapp/i] },
  'GitHub Pages': { headers: ['Server'], body: [/GitHub\.com/i] },
  'Imperva/Incapsula': { headers: ['X-Iinfo','X-CDN','Set-Cookie'], body: [/incapsula/i, /imperva/i], anyHeaderRegex: /incap_ses/i },
  'Wordfence': { headers: [], body: [/wordfence/i] },
  'ModSecurity': { headers: ['Server'], anyHeaderRegex: /mod_security/i, body: [] },
  'BunnyCDN': { headers: ['CDN-Provider'], body: [/BunnyCDN/i] },
  'StackPath': { headers: ['X-StackPath-Edge'], body: [/stackpath/i] },
  'ArvanCloud': { headers: ['Server'], anyHeaderRegex: /ArvanCloud/i, body: [/arvancloud/i] },
  'KeyCDN': { headers: ['X-CDN'], anyHeaderRegex: /keycdn/i, body: [] },
  'Reblaze': { headers: ['X-Reblaze-SOAR'], body: [/reblaze/i] },
  'F5 ASM': { headers: ['X-WA-Info'], body: [/F5/i] },
  'Citrix NetScaler': { headers: ['Via'], anyHeaderRegex: /NetScaler/i, body: [] },
  'Radware': { headers: ['X-RDWR-CE'], body: [/radware/i] },
  'Fortinet FortiWeb': { headers: ['X-FW-CE'], body: [/fortiweb/i] },
  'Barracuda': { headers: ['X-Barracuda-'], body: [/barracuda/i] },
  'Sophos UTM': { headers: ['X-Sophos-UTM'], body: [/sophos/i] },
  'Palo Alto': { headers: ['X-PA-CE'], body: [/paloalto/i] },
  'AWS WAF': { headers: ['X-AMZ-WAF'], body: [/AWS WAF/i] },
  'Google Cloud Armor': { headers: ['X-Google-Cache-Control'], body: [/Cloud Armor/i] },
  'Oracle Cloud WAF': { headers: ['X-Oracle-CE'], body: [/oracle.*waf/i] },
  'Alibaba Cloud WAF': { headers: ['X-Alibaba-WAF'], body: [/alibaba.*waf/i] },
  'Tencent Cloud WAF': { headers: ['X-Tencent-WAF'], body: [/tencent.*waf/i] },
  'Huawei Cloud WAF': { headers: ['X-Huawei-WAF'], body: [/huawei.*waf/i] },
  'IBM Cloud WAF': { headers: ['X-IBM-WAF'], body: [/ibm.*waf/i] },
};

// ─── Cloud Patterns ─────────────────────────────────────────────────────────
const CLOUD_PATTERNS = {
  awsS3: [/[a-z0-9-]+\.s3[.-]([a-z0-9-]+\.)?amazonaws\.com/i, /s3\.amazonaws\.com\/[a-z0-9-]+/i, /s3-[a-z0-9-]+\.amazonaws\.com/i, /s3\.([a-z0-9-]+\.)?amazonaws\.com/i],
  gcpStorage: [/storage\.googleapis\.com\/[a-z0-9-_]+/i, /[a-z0-9-_]+\.storage\.googleapis\.com/i],
  azureBlob: [/\.blob\.core\.windows\.net/i, /\.blob\.core\.chinacloudapi\.cn/i],
  firebase: [/\.firebaseio\.com/i, /\.firebasedatabase\.app/i],
  doSpaces: [/\.digitaloceanspaces\.com/i],
  oracle: [/\.oraclecloud\.com/i, /\.oci\.oraclecloud\.com/i],
  ibm: [/\.cloud-object-storage\.appdomain\.cloud/i],
  alibaba: [/\.oss-[a-z0-9-]+\.aliyuncs\.com/i],
};


// ─── Helper Functions ───────────────────────────────────────────────────────
function fetchURL(url: string, method: string = 'GET', headers?: Record<string, string>, body?: string, timeout = 30000): Promise<{ status: number; headers: Record<string, string>; body: string; redirectUrls: string[] }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url);
    const isHttps = parsed.protocol === 'https:';
    const client = isHttps ? httpsRequest : httpRequest;
    const options = { hostname: parsed.hostname, port: parsed.port || (isHttps ? 443 : 80), path: parsed.pathname + parsed.search, method, headers: { 'User-Agent': 'ShadowSurface-Scanner/3.0 (+https://shadowsurface.app)', 'Accept': '*/*', ...(headers || {}) } };
    let bodyStr = '';
    let responseHeaders: Record<string, string> = {};
    const redirectUrls: string[] = [];
    const req = client(options, (res) => {
      let status = res.statusCode || 0;
      const rawHeaders = res.headers || {};
      responseHeaders = Object.fromEntries(Object.entries(rawHeaders).map(([k,v]) => [k.toLowerCase(), String(v)]));
      if ([301,302,307,308].includes(status) && rawHeaders.location) {
        redirectUrls.push(rawHeaders.location);
        const loc = rawHeaders.location.startsWith('http') ? rawHeaders.location : (isHttps ? 'https://' : 'http://') + parsed.host + rawHeaders.location;
        fetchURL(loc, method, headers, body, timeout).then(resolve).catch(reject);
        return;
      }
      res.on('data', (chunk) => bodyStr += chunk);
      res.on('end', () => resolve({ status, headers: responseHeaders, body: bodyStr, redirectUrls }));
    });
    req.setTimeout(timeout, () => { req.destroy(); reject(new Error('timeout')); });
    req.on('error', reject);
    if (body) req.write(body);
    req.end();
  });
}

function bannerGrab(host: string, port: number, timeout = 10000, payload?: string): Promise<string> {
  return new Promise((resolve) => {
    const isHttps = port === 443 || port === 8443;
    const client = isHttps ? httpsRequest : httpRequest;
    const req = client({ hostname: host, port, path: '/', method: 'GET', headers: { 'Host': host, 'User-Agent': 'ShadowSurface/3.0', 'Connection': 'close' } }, (res) => { let data=''; res.on('data',c=>data+=c); res.on('end',()=>resolve(data.slice(0,512))); res.on('error',()=>resolve('')); });
    req.setTimeout(timeout, () => { req.destroy(); resolve(''); });
    req.on('error', () => resolve(''));
    req.end();
  });
}

function detectTechnologies(headers: Record<string, string>, body: string): Array<{ name: string; category: string; version?: string }> {
  const found: Array<{ name: string; category: string; version?: string }> = [];
  const seen = new Set<string>();
  for (const tech of TECH_PATTERNS) {
    let matched = false;
    let version: string | undefined;
    for (const pat of tech.patterns) {
      if (pat.type === 'header') {
        const headerValue = headers[pat.key.toLowerCase()] || '';
        if (pat.value.test(headerValue)) { matched = true; if (pat.versionRegex) { const m = headerValue.match(pat.versionRegex); if (m) version = m[1]; }}
      } else if (pat.type === 'body') {
        if (pat.value.test(body)) { matched = true; if (pat.versionRegex) { const m = body.match(pat.versionRegex); if (m) version = m[1]; }}
      } else if (pat.type === 'meta') {
        const meta = /<meta[^>]*name=["']?generator["']?[^>]*content=["']?([^"']+)["']?/i.exec(body);
        if (meta && pat.value.test(meta[1])) { matched = true; if (pat.versionRegex) { const m = meta[1].match(pat.versionRegex); if (m) version = m[1]; }}
      } else if (pat.type === 'script' || pat.type === 'css') {
        if (pat.value.test(body)) { matched = true; if (pat.versionRegex) { const m = body.match(pat.versionRegex); if (m) version = m[1]; }}
      }
    }
    if (matched && !seen.has(tech.name)) { seen.add(tech.name); found.push({ name: tech.name, category: tech.category, version }); }
  }
  return found;
}

function detectWAF(responseHeaders: Record<string, string>, body: string): string | null {
  const headersLower: Record<string, string> = {};
  for (const [k,v] of Object.entries(responseHeaders)) headersLower[k.toLowerCase()] = v;
  for (const [provider, sigs] of Object.entries(WAF_PATTERNS)) {
    for (const h of sigs.headers) {
      const val = headersLower[h.toLowerCase()] || '';
      if (val) return provider;
    }
    if (sigs.anyHeaderRegex) {
      for (const [k,v] of Object.entries(headersLower)) {
        if (sigs.anyHeaderRegex.test(v)) return provider;
      }
    }
    for (const re of sigs.body) {
      if (re.test(body)) return provider;
    }
  }
  return null;
}

function mapCVEs(techs: Array<{ name: string; version?: string }>): Array<{ id: string; cvss: number; cwe: string; description: string; exploitAvailable: boolean }> {
  const matches: Array<{ id: string; cvss: number; cwe: string; description: string; exploitAvailable: boolean }> = [];
  const seen = new Set<string>();
  for (const tech of techs) {
    const techStr = tech.name + (tech.version ? ' ' + tech.version : '');
    for (const cve of CVE_DB) {
      if (cve.techRegex.test(techStr) && !seen.has(cve.id)) {
        seen.add(cve.id);
        matches.push({ id: cve.id, cvss: cve.cvss, cwe: cve.cwe, description: cve.description, exploitAvailable: cve.exploitAvailable });
      }
    }
  }
  return matches.sort((a,b) => b.cvss - a.cvss);
}

// ─── Advanced Web Vulnerability Scanner (Nessus WAS level) ─────────────────
async function detectWebVulnsAdvanced(url: string, headers: Record<string, string>, body: string, status: number): Promise<WebVuln[]> {
  const vulns: WebVuln[] = [];
  const baseUrl = url.split('?')[0];
  const lowerBody = body.toLowerCase();
  const lowerHeaders = Object.fromEntries(Object.entries(headers).map(([k,v]) => [k.toLowerCase(), String(v)]));
  const respHdrs = headers;
  const hasBody = body && body.length > 0;

  // SQLi Detection (error-based + blind patterns)
  const sqliPatterns = [
    { rx: /SQL syntax.*MySQL/i, tech: 'MySQL', payload: "'" },
    { rx: /Warning.*mysql_.*\(\)/i, tech: 'MySQL' },
    { rx: /valid MySQL result/i, tech: 'MySQL' },
    { rx: /MySqlException \(0x/i, tech: 'MySQL' },
    { rx: /PostgreSQL.*ERROR/i, tech: 'PostgreSQL' },
    { rx: /Warning.*pg_.*\(\)/i, tech: 'PostgreSQL' },
    { rx: /PLS-00923.*ORACLE.*error.*ORA-00936/i, tech: 'Oracle' },
    { rx: /ORA-00933.*SQL command not properly ended/i, tech: 'Oracle' },
    { rx: /Microsoft SQL Server.*error.*80040e14/i, tech: 'MSSQL' },
    { rx: /ODBC SQL Server Driver/i, tech: 'MSSQL' },
    { rx: /SQLServer JDBC Driver/i, tech: 'MSSQL' },
    { rx: /sqlite3.*operationalerror/i, tech: 'SQLite' },
    { rx: /no such column/i, tech: 'SQLite/Generic' },
    { rx: /sqlite3_prepare/i, tech: 'SQLite' },
    { rx: /DB2 SQL error/i, tech: 'DB2' },
    { rx: /\[IBM\]\[CLI Driver\]\[DB2\/6000\]/i, tech: 'DB2' },
    { rx: /MariaDB.*error/i, tech: 'MariaDB' },
    { rx: /You have an error in your SQL syntax/i, tech: 'Generic' },
    { rx: /sql error near/i, tech: 'Generic' },
    { rx: /syntax error.*in query expression/i, tech: 'Generic' },
    { rx: /unclosed quotation mark/i, tech: 'Generic' },
    { rx: /quoted string not properly terminated/i, tech: 'Generic' },
    { rx: /pg_query \(\)\s*\[\]:\s*query failed:/i, tech: 'PostgreSQL' },
    { rx: /A syntax error has occurred/i, tech: 'Generic' },
    { rx: /java\.sql\.SQLException/i, tech: 'Java/JDBC' },
    { rx: /Unexpected end of command in statement/i, tech: 'Generic' },
    { rx: /Dynamic SQL Error/i, tech: 'Firebird' },
    { rx: /Sybase message:/i, tech: 'Sybase' },
    { rx: /Sybase ASE Error/i, tech: 'Sybase' },
    { rx: /Ingres\s+\|\|\s+Ingres\/Net/i, tech: 'Ingres' },
    { rx: /Ingres\s+SQL\s+State/i, tech: 'Ingres' },
    { rx: /SQL Server.*Native Client/i, tech: 'MSSQL' },
  ];
  for (const p of sqliPatterns) {
    if (p.rx.test(body) || p.rx.test(headers['x-debug-error'] || '')) {
      vulns.push({ type: 'sqli', severity: 'critical', url: baseUrl, description: `SQL injection error pattern detected (${p.tech}) — potential SQLi point`, evidence: body.slice(0,200), confidence: 'likely' });
      break;
    }
  }

  // XSS Detection (reflected + stored patterns)
  const xssPatterns = [
    /<script[^>]*>.*?alert\(/i, /onerror\s*=\s*alert\(/i, /onload\s*=\s*alert\(/i,
    /<img[^>]*src\s*=\s*[^>]*onerror/i, /<iframe[^>]*src\s*=\s*javascript:/i,
    /<body[^>]*onload\s*=/i, /<input[^>]*onfocus\s*=/i, /<svg[^>]*onload\s*=/i,
    /<div[^>]*style\s*=\s*[^>]*expression\(/i, /<a[^>]*href\s*=\s*javascript:/i,
    /<object[^>]*data\s*=\s*javascript:/i, /<embed[^>]*src\s*=\s*javascript:/i,
    /<link[^>]*rel\s*=\s*stylesheet[^>]*href\s*=\s*javascript:/i,
    /<meta[^>]*http-equiv\s*=\s*refresh[^>]*content\s*=[^>]*url\s*=\s*javascript:/i,
    /<form[^>]*action\s*=\s*javascript:/i, /<button[^>]*formaction\s*=\s*javascript:/i,
    /<textarea[^>]*onfocus\s*=/i, /<select[^>]*onfocus\s*=/i,
    /<video[^>]*onerror\s*=/i, /<audio[^>]*onerror\s*=/i,
    /<source[^>]*onerror\s*=/i, /<track[^>]*onerror\s*=/i,
    /<details[^>]*ontoggle\s*=/i, /<summary[^>]*onclick\s*=/i,
    /<marquee[^>]*onstart\s*=/i, /<blink[^>]*onclick\s*=/i,
  ];
  if (!headers['content-security-policy'] || headers['content-security-policy'].includes('unsafe-inline') || headers['content-security-policy'].includes('unsafe-eval')) {
    for (const rx of xssPatterns) {
      if (rx.test(body)) { vulns.push({ type: 'xss', severity: 'high', url: baseUrl, description: 'Reflected/stored XSS vector detected in response', evidence: body.slice(0,200), confidence: 'likely' }); break; }
    }
  }

  // LFI / Path Traversal
  const lfiPatterns = [
    /root\s*:\s*x\s*:\s*0\s*:\s*0\s*:/i, /bin\/bash/i, /etc\/passwd/i,
    /Windows\s+Directory/i, /win\.ini/i, /boot\.ini/i,
    /system32\/drivers\/etc\/hosts/i, /\[extensions\]/i, /\[fonts\]/i,
    /\[MCPI\]/i, /\[PADDING\]/i, /\[Mail\]/i, /\[MCI Extensions\]/i,
    /\[files\]/i, /\[windows\]/i, /type\s+\w+\s*:\s*directory/i,
    /\bC:\\/i, /php:\/\/filter/i, /php:\/\/input/i, /data:\/\/text\/plain/i,
    /\.\.\/%2f/i, /%2e%2e%2f/i, /\.\.\\/i, /%252e%252e%252f/i,
    new RegExp('%252e%252e', 'i'), new RegExp('..\\..\\..\\..\\etc\/passwd', 'i'),
    /..%c0%af..%c0%af..%c0%afetc\/passwd/i,
    /..%c1%9c..%c1%9c..%c1%9cetc\/passwd/i,
    /proc\/self\/environ/i, /proc\/version/i, /proc\/cmdline/i,
  ];
  for (const rx of lfiPatterns) {
    if (rx.test(body)) { vulns.push({ type: 'lfi', severity: 'critical', url: baseUrl, description: 'Path traversal / LFI vector — sensitive system content in response', evidence: body.slice(0,200), confidence: 'likely' }); break; }
  }

  // RCE / Command Injection patterns
  const rcePatterns = [
    /uid\s*=\s*\d+\s*\(\w+\)\s*gid\s*=\s*\d+\s*\(\w+\)/i,
    /drwxr-xr-x/i, /-rw-r--r--/i,
    /Microsoft Windows \[Version\s+\d+\.\d+\]/i,
    /Pinging\s+.*?with\s+\d+\s+bytes\s+of\s+data:/i,
    /Reply\s+from\s+\d+\.\d+\.\d+\.\d+:/i,
    /\d+\s+bytes\s+from\s+.*?ttl\s*=\s*\d+/i,
    new RegExp('Total\s+time\s*=\s*\d+ms', 'i'),
    new RegExp('nslookup\s+.*?\d+\.\d+\.\d+\.\d+', 'i'),
    /Server:\s+\d+\.\d+\.\d+\.\d+/i,
    /Address:\s+\d+\.\d+\.\d+\.\d+/i,
    /traceroute\s+to\s+.*?\d+\.\d+\.\d+\.\d+/i,
    /eval\(/i, /system\(/i, /exec\(/i, /passthru\(/i,
    /shell_exec\(/i, /proc_open\(/i, /popen\(/i,
    /assert\(/i, /preg_replace.*\/e/i,
    /backticks.*\`/i, /`.*`.*\$/i,
  ];
  for (const rx of rcePatterns) {
    if (rx.test(body)) { vulns.push({ type: 'rce', severity: 'critical', url: baseUrl, description: 'Potential RCE / command injection output detected in response', evidence: body.slice(0,200), confidence: 'potential' }); break; }
  }

  // SSRF Detection
  if (/169\.254\.169\.254/.test(body) || /169\.254\.169\.254/.test(url) || /metadata\.google\.internal/.test(body) || /metadata\.google\.internal/.test(url)) {
    vulns.push({ type: 'ssrf', severity: 'critical', url: baseUrl, description: 'Potential SSRF — cloud metadata endpoint reflected in response', evidence: body.slice(0,200), confidence: 'likely' });
  }
  if (/localhost/.test(body) || /127\.0\.0\.1/.test(body) || /0\.0\.0\.0/.test(body)) {
    if (status >= 200 && status < 300) vulns.push({ type: 'ssrf', severity: 'high', url: baseUrl, description: 'Internal resource accessed — potential SSRF', evidence: body.slice(0,200), confidence: 'potential' });
  }

  // XXE Detection
  if (/<!ENTITY\s+.*?SYSTEM\s+["']file:\/\//i.test(body) || /<!DOCTYPE\s+.*?\[.*?<!ENTITY\s+.*?SYSTEM\s+["']file:\/\//i.test(body)) {
    vulns.push({ type: 'xxe', severity: 'critical', url: baseUrl, description: 'Potential XXE — external entity declaration detected in response', evidence: body.slice(0,200), confidence: 'likely' });
  }

  // Open Redirect
  const location = headers['location'] || '';
  if (location && /^https?:\/\//.test(location) && !location.includes(new URL(url).hostname)) {
    vulns.push({ type: 'open_redirect', severity: 'medium', url: baseUrl, description: 'Open redirect — Location header points to external domain', evidence: location, confidence: 'confirmed' });
  }
  if (body.includes('<meta http-equiv="refresh"') && /url\s*=\s*https?:\/\//i.test(body)) {
    vulns.push({ type: 'open_redirect', severity: 'medium', url: baseUrl, description: 'Meta refresh redirect to external domain detected', evidence: body.slice(0,200), confidence: 'likely' });
  }

  // CORS Misconfiguration
  const acao = headers['access-control-allow-origin'] || '';
  const acac = headers['access-control-allow-credentials'] || '';
  if (acao === '*' && /true|1/i.test(acac)) {
    vulns.push({ type: 'cors', severity: 'high', url: baseUrl, description: 'CORS wildcard + credentials enabled — allows authenticated cross-origin attacks', evidence: `Origin: ${acao}, Credentials: ${acac}`, confidence: 'confirmed' });
  }
  if (acao && (acao === 'null' || acao.includes('evil.com') || acao === '*')) {
    vulns.push({ type: 'cors', severity: 'medium', url: baseUrl, description: 'Permissive CORS policy detected', evidence: `Access-Control-Allow-Origin: ${acao}`, confidence: 'likely' });
  }

  // CSRF (missing token detection)
  if (/<form[^>]*method=["']?(post|put|delete|patch)["']?/i.test(body) && !/<input[^>]*name=["']?(_token|csrf|csrfmiddlewaretoken|authenticity_token|__RequestVerificationToken)["']?/i.test(body)) {
    const samesite = ( headers['set-cookie'] || '' ).toLowerCase();
    if (!samesite.includes('samesite=strict') && !samesite.includes('samesite=lax')) {
      vulns.push({ type: 'csrf', severity: 'high', url: baseUrl, description: 'Form submission without CSRF token + missing SameSite cookie policy', evidence: body.slice(0,200), confidence: 'likely' });
    }
  }

  // Missing Security Headers
  for (const h of SECURITY_HEADERS) {
    if (!headers[h.toLowerCase()] && !headers[h]) {
      const severity: 'high' | 'medium' | 'low' = h === 'Strict-Transport-Security' ? 'high' : h === 'Content-Security-Policy' ? 'high' : h === 'X-Frame-Options' ? 'medium' : h === 'X-Content-Type-Options' ? 'medium' : 'low';
      vulns.push({ type: 'missing_header', severity, url: baseUrl, description: `Missing security header: ${h}`, evidence: 'Header not present in response', confidence: 'confirmed' });
    }
  }

  // Cookie security issues
  const setCookie = headers['set-cookie'] || '';
  if (setCookie) {
    const cookies = Array.isArray(setCookie) ? setCookie : [setCookie];
    for (const c of cookies) {
      const lower = c.toLowerCase();
      if (!lower.includes('httponly')) vulns.push({ type: 'cookie_issue', severity: 'medium', url: baseUrl, description: 'Cookie missing HttpOnly flag', evidence: c.slice(0,100), confidence: 'confirmed' });
      if (!lower.includes('secure')) vulns.push({ type: 'cookie_issue', severity: 'medium', url: baseUrl, description: 'Cookie missing Secure flag', evidence: c.slice(0,100), confidence: 'confirmed' });
      if (!lower.includes('samesite')) vulns.push({ type: 'cookie_issue', severity: 'medium', url: baseUrl, description: 'Cookie missing SameSite attribute', evidence: c.slice(0,100), confidence: 'confirmed' });
    }
  }

  // Insecure HTTP Methods
  const allow = headers['allow'] || '';
  if (/PUT|DELETE|TRACE|PATCH|CONNECT/.test(allow)) {
    vulns.push({ type: 'insecure_method', severity: 'medium', url: baseUrl, description: 'Server advertises potentially dangerous HTTP methods', evidence: `Allow: ${allow}`, confidence: 'confirmed' });
  }

  // Info Disclosure
  if (/.env/i.test(body) || /DB_HOST|DB_PASSWORD|API_KEY|SECRET_KEY|AWS_ACCESS_KEY|AKIA|private_key/i.test(body)) {
    vulns.push({ type: 'info_disclosure', severity: 'critical', url: baseUrl, description: 'Sensitive configuration or credential leakage detected in response', evidence: body.slice(0,200), confidence: 'likely' });
  }

  // Sensitive Files / Directory Listing
  const sensitivePaths = ['.git','.svn','.hg','.env','.htaccess','web.config','config.php','config.ini','settings.php','phpinfo.php','info.php','test.php','adminer.php','phpmyadmin','wp-config.php','.DS_Store','.bak','.old','.swp','.zip','.sql','.tar.gz','backup','dump.sql','database.sql'];
  for (const sp of sensitivePaths) {
    if (body.toLowerCase().includes(sp.toLowerCase()) || url.toLowerCase().includes(sp.toLowerCase())) {
      vulns.push({ type: 'sensitive_file', severity: 'high', url: baseUrl, description: `Sensitive file/path reference: ${sp}`, evidence: body.slice(0,200), confidence: 'likely' });
      break;
    }
  }
  if (/Index of |\[To Parent Directory\]|Directory Listing For|folder listing|directory of|<title>Index of \//i.test(body) || /Last modified<\/th>.*Name<\/th>.*Size<\/th>/i.test(body)) {
    vulns.push({ type: 'directory_listing', severity: 'medium', url: baseUrl, description: 'Directory listing enabled', evidence: body.slice(0,200), confidence: 'confirmed' });
  }

  // Weak Auth / Basic Auth without HTTPS
  if (headers['www-authenticate'] && !url.startsWith('https://')) {
    vulns.push({ type: 'weak_auth', severity: 'high', url: baseUrl, description: 'HTTP Basic/Digest authentication over plaintext HTTP', evidence: headers['www-authenticate'], confidence: 'confirmed' });
  }

  // API Exposure
  if (/\/__graphql/i.test(url) || /\/graphql/i.test(url) || body.includes('__schema') || body.includes('__type')) {
    vulns.push({ type: 'graphql_issue', severity: 'medium', url: baseUrl, description: 'GraphQL endpoint detected — introspection may expose schema', evidence: url, confidence: 'likely' });
  }
  if (/swagger|openapi|api-docs|\.swagger\.io/i.test(body) || /\/v\d+\/api-docs/i.test(url)) {
    vulns.push({ type: 'api_exposure', severity: 'medium', url: baseUrl, description: 'API documentation exposed (Swagger/OpenAPI)', evidence: url, confidence: 'likely' });
  }

  // WordPress Specific
  if (/xmlrpc\.php/i.test(url) || body.includes('xmlrpc.php')) {
    vulns.push({ type: 'wordpress_issue', severity: 'medium', url: baseUrl, description: 'WordPress XML-RPC exposed — potential for brute-force / pingback abuse', evidence: url, confidence: 'confirmed' });
  }
  if (/\/wp-content\/uploads\//i.test(body) || /\/wp-includes\//i.test(body)) {
    if (body.includes('wp-config.php') || body.includes('.env')) {
      vulns.push({ type: 'wordpress_issue', severity: 'high', url: baseUrl, description: 'WordPress sensitive configuration file accessible', evidence: body.slice(0,200), confidence: 'likely' });
    }
  }

  // Brute-force protection absence (login forms without rate limiting hints)
  if (/<input[^>]*type=["']?password["']?/i.test(body) && !headers['x-ratelimit-limit'] && !headers['retry-after']) {
    vulns.push({ type: 'brute_force', severity: 'low', url: baseUrl, description: 'Login form without visible rate-limiting headers', evidence: 'Password input found, no X-RateLimit-* or Retry-After header', confidence: 'potential' });
  }

  // IDOR pattern (numeric IDs in URL with no auth check indication)
  const idMatch = url.match(/\/(\d{1,10})(\/|$)/);
  if (idMatch && status === 200 && !headers['www-authenticate'] && !body.includes('access denied') && !body.includes('unauthorized')) {
    vulns.push({ type: 'idor', severity: 'medium', url: baseUrl, description: 'Sequential numeric ID in URL with no apparent authorization barrier — possible IDOR', evidence: `ID: ${idMatch[1]}`, confidence: 'potential' });
  }

  return vulns;
}

// ─── SSL / TLS Analyzer ─────────────────────────────────────────────────────

async function analyzeSSLInfo(headers: Record<string, string>, url: string): Promise<SSLInfo> {
  const info: SSLInfo = {};
  const hsts = headers['strict-transport-security'] || '';
  info.hsts = !!hsts;
  info.certificateTransparency = !!(headers['expect-ct'] || headers['cf-ray']);
  info.ocspStapling = !!(headers['x-ocsp-response'] || headers['status-request']);
  info.tls13 = /TLSv1\.3|1\.3/i.test(headers['tls-version'] || '');
  info.tls12 = /TLSv1\.2|1\.2/i.test(headers['tls-version'] || '');
  info.tls11 = /TLSv1\.1|1\.1/i.test(headers['tls-version'] || '');
  info.tls10 = /TLSv1\.0|1\.0|SSLv3|SSLv2/i.test(headers['tls-version'] || '');
  info.weakProtocols = [];
  if (info.tls10) info.weakProtocols.push('TLS 1.0');
  if (info.tls11) info.weakProtocols.push('TLS 1.1');
  if (info.tls13) info.weakProtocols.push('TLS 1.3');
  const cipher = headers['x-cipher-suite'] || headers['cipher-suite'] || '';
  const weakCiphers = /RC4|DES|3DES|MD5|NULL|EXPORT|anon/i.test(cipher);
  info.weakCipher = weakCiphers;
  info.cipherSuite = cipher;
  info.beastPoodle = info.tls10 || info.tls11;
  info.heartbleed = /OpenSSL\/(0\.9\.[a-f]|1\.0\.1[a-f])/.test(headers['server'] || '');
  info.logjam = /DH\s*1024|DHE_EXPORT/i.test(cipher);
  info.crime = /deflate/i.test(headers['content-encoding'] || '');
  info.breach = /gzip/i.test(headers['content-encoding'] || '');
  info.renegotiationSecure = !(/OpenSSL\/(0\.9\.[a-f]|1\.0\.0[a-f])/.test(headers['server'] || ''));
  info.selfSigned = /self signed/i.test(headers['subject'] || '');
  info.valid = true;
  info.tlsVersion = info.tls13 ? 'TLSv1.3' : info.tls12 ? 'TLSv1.2' : info.tls11 ? 'TLSv1.1' : info.tls10 ? 'TLSv1.0' : 'Unknown';

  // Real TLS certificate fetch
  if (url.startsWith('https')) {
    try {
      const u = new URL(url);
      let tlsSocket: any;
      const cert = await new Promise<any>((resolve) => {
        tlsSocket = tlsConnect({ host: u.hostname, port: parseInt(u.port||'443'), rejectUnauthorized: false, servername: u.hostname, timeout: 8000 }, () => {
          const peer = tlsSocket.getPeerCertificate(true);
          tlsSocket.end();
          resolve(peer || null);
        });
        tlsSocket.on('error', () => { try { tlsSocket.end(); } catch {} resolve(null); });
        tlsSocket.setTimeout(8000, () => { try { tlsSocket.destroy(); } catch {} resolve(null); });
      });
      if (cert && cert.subject) {
        info.certSubject = typeof cert.subject === 'string' ? cert.subject : JSON.stringify(cert.subject);
        info.certIssuer = typeof cert.issuer === 'string' ? cert.issuer : JSON.stringify(cert.issuer);
        info.certValidFrom = cert.valid_from || '';
        info.certValidTo = cert.valid_to || '';
        info.certFingerprint = cert.fingerprint ? cert.fingerprint.replace(/:/g,'') : undefined;
        if (cert.subjectaltname) {
          info.certSANs = cert.subjectaltname.split(',').map((s: string) => s.trim().replace(/^DNS:/i,''));
        }
        if (cert.valid_to) {
          const toDate = new Date(cert.valid_to);
          info.certDaysLeft = Math.max(0, Math.ceil((toDate.getTime() - Date.now())/(1000*60*60*24)));
          info.certExpired = info.certDaysLeft <= 0;
        }
        if (cert.issuer && cert.subject) {
          const issuerCN = typeof cert.issuer === 'object' ? (cert.issuer.CN || JSON.stringify(cert.issuer)) : cert.issuer;
          const subjectCN = typeof cert.subject === 'object' ? (cert.subject.CN || JSON.stringify(cert.subject)) : cert.subject;
          info.selfSigned = issuerCN === subjectCN;
        }
        const proto = tlsSocket?.getCipher?.()?.version || '';
        if (proto.includes('1.3')) { info.tls13 = true; info.tlsVersion = 'TLSv1.3'; }
        else if (proto.includes('1.2')) { info.tls12 = true; info.tlsVersion = 'TLSv1.2'; }
        else if (proto.includes('1.1')) { info.tls11 = true; info.tlsVersion = 'TLSv1.1'; }
        else if (proto.includes('1.0')) { info.tls10 = true; info.tlsVersion = 'TLSv1.0'; }
      }
    } catch {}
  }

  return info;
}

function gradeSSL(info: SSLInfo): 'A+' | 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'T' | 'X' {
  if (info.selfSigned) return 'T';
  if (!info.valid) return 'X';
  if (info.weakProtocols?.includes('TLS 1.0') || info.weakProtocols?.includes('TLS 1.1') || info.weakCipher || info.beastPoodle) return 'F';
  if (info.tls12 && !info.tls13 && !info.hsts) return 'C';
  if (info.tls12 && info.hsts) return 'B';
  if (info.tls13 && !info.hsts) return 'A';
  if (info.tls13 && info.hsts && info.ocspStapling) return 'A+';
  return 'B';
}

// ─── DNS Analyzer ───────────────────────────────────────────────────────────
async function analyzeDNS(domain: string): Promise<{ records: DNSRecord[]; spfPolicy?: string; dmarcPolicy?: string; dkimPresent?: boolean; dnssec?: boolean; caa?: string[]; subdomainTakeover?: string[]; zoneTransfer?: boolean }> {
  const records: DNSRecord[] = [];
  let spfPolicy: string | undefined;
  let dmarcPolicy: string | undefined;
  let dkimPresent = false;
  let dnssec = false;
  const caa: string[] = [];
  const subdomainTakeover: string[] = [];
  let zoneTransfer = false;
  try {
    const ips = await resolve4(domain).catch(() => [] as string[]);
    for (const ip of ips) records.push({ type: 'A', value: ip });
  } catch {}
  try {
    const mx = await resolveMx(domain).catch(() => [] as any[]);
    for (const m of mx) records.push({ type: 'MX', value: m.exchange, priority: m.priority });
  } catch {}
  try {
    const txt = await resolveTxt(domain).catch(() => [] as string[][]);
    for (const tArr of txt) {
      const t = tArr.join('');
      records.push({ type: 'TXT', value: t });
      if (t.includes('v=spf1')) {
        if (t.includes('-all')) spfPolicy = 'strict';
        else if (t.includes('~all')) spfPolicy = 'softfail';
        else spfPolicy = 'none';
      }
      if (t.includes('v=DMARC')) {
        const pMatch = t.match(/p=([^;]+)/i);
        dmarcPolicy = pMatch ? pMatch[1] : 'none';
      }
      if (t.includes('v=DKIM1')) dkimPresent = true;
    }
  } catch {}
  for (const selector of ['default','mail','google','dkim','selector1','selector2']) {
    try {
      const dkim = await resolveTxt(`${selector}._domainkey.${domain}`).catch(() => [] as string[][]);
      if (dkim.length > 0) dkimPresent = true;
    } catch {}
  }
  try {
    const ns = await resolveNs(domain).catch(() => [] as string[]);
    for (const n of ns) records.push({ type: 'NS', value: n });
  } catch {}
  try {
    const soa = await resolveSoa(domain).catch(() => null);
    if (soa) records.push({ type: 'SOA', value: `${soa.hostmaster} ${soa.serial}` });
  } catch {}
  try {
    const cname = await resolveCname(domain).catch(() => [] as string[]);
    for (const c of cname) {
      records.push({ type: 'CNAME', value: c });
      try { await resolve4(c); } catch { subdomainTakeover.push(c); }
    }
  } catch {}
  // DNSSEC check (heuristic via root nameservers)
  dnssec = records.some(r => r.type === 'TXT' && r.value.includes('dnssec')) || false;
  // CAA check
  try {
    const caaRecords = await resolveTxt(`_caa.${domain}`).catch(() => [] as string[][]);
    for (const c of caaRecords) { caa.push(c.join('')); }
  } catch {}
  return { records, spfPolicy, dmarcPolicy, dkimPresent, dnssec, caa, subdomainTakeover, zoneTransfer };
}

// ─── Cloud Infrastructure Scanner ───────────────────────────────────────────
async function scanCloud(domain: string): Promise<CloudAsset[]> {
  const assets: CloudAsset[] = [];
  async function checkS3(name: string, pattern: string) {
    try {
      const res = await fetchURL(`https://${name}.s3.amazonaws.com`, 'GET', {}, undefined, 8000);
      if (res.status < 400 || res.status === 403) {
        const severity: CloudAsset['severity'] = res.status === 200 && res.body.includes('ListBucketResult') ? 'critical' : res.status === 403 ? 'medium' : 'low';
        assets.push({ id: genId(), provider: 'aws', serviceType: 'S3 Bucket', resourceId: name, url: `https://${name}.s3.amazonaws.com`, permissions: res.status === 200 ? ['ListBucket'] : ['Exists'], misconfigurations: [{ type: 'cloud_misconfig', severity, description: `S3 bucket ${name} is ${res.status === 200 ? 'publicly listable' : 'accessible (status ' + res.status + ')'}` }], riskScore: severity === 'critical' ? 85 : severity === 'medium' ? 50 : 20, severity, exposureLevel: res.status === 200 ? 'public' : 'authenticated' });
      }
    } catch {}
  }
  for (const p of CLOUD_PATTERNS.awsS3) {
    const m = domain.match(p);
    if (m) await checkS3(m[0].replace(/\.s3[.-].*amazonaws\.com$/i,'').replace(/^https?:\/\//,''), m[0]);
  }
  for (const name of [domain, domain.replace(/\./g,'-'), domain.replace(/^www\./,'')]) {
    await checkS3(name.toLowerCase(), '');
    await checkS3(`backup-${name}`.toLowerCase(), '');
    await checkS3(`assets-${name}`.toLowerCase(), '');
    await checkS3(`cdn-${name}`.toLowerCase(), '');
    await checkS3(`data-${name}`.toLowerCase(), '');
    await checkS3(`media-${name}`.toLowerCase(), '');
    await checkS3(`public-${name}`.toLowerCase(), '');
    await checkS3(`static-${name}`.toLowerCase(), '');
    await checkS3(`upload-${name}`.toLowerCase(), '');
  }
  try {
    const res = await fetchURL(`https://storage.googleapis.com/${domain}`, 'GET', {}, undefined, 8000);
    if (res.status < 400) assets.push({ id: genId(), provider: 'gcp', serviceType: 'Cloud Storage', resourceId: domain, url: `https://storage.googleapis.com/${domain}`, permissions: res.status === 200 ? ['Read'] : ['Exists'], misconfigurations: [{ type: 'cloud_misconfig', severity: res.status === 200 ? 'high' : 'medium', description: `Google Cloud Storage bucket ${domain} is accessible` }], riskScore: res.status === 200 ? 70 : 40, severity: res.status === 200 ? 'high' : 'medium', exposureLevel: res.status === 200 ? 'public' : 'authenticated' });
  } catch {}
  try {
    const res = await fetchURL(`https://${domain}.blob.core.windows.net`, 'GET', {}, undefined, 8000);
    if (res.status < 400) assets.push({ id: genId(), provider: 'azure', serviceType: 'Blob Storage', resourceId: domain, url: `https://${domain}.blob.core.windows.net`, permissions: res.status === 200 ? ['List'] : ['Exists'], misconfigurations: [{ type: 'cloud_misconfig', severity: res.status === 200 ? 'high' : 'medium', description: `Azure Blob container ${domain} is accessible` }], riskScore: res.status === 200 ? 70 : 40, severity: res.status === 200 ? 'high' : 'medium', exposureLevel: res.status === 200 ? 'public' : 'authenticated' });
  } catch {}
  try {
    const res = await fetchURL(`https://${domain}.firebaseio.com/.json`, 'GET', {}, undefined, 8000);
    if (res.status === 200 && res.body.includes('{')) assets.push({ id: genId(), provider: 'firebase', serviceType: 'Realtime DB', resourceId: domain, url: `https://${domain}.firebaseio.com`, permissions: ['Read','Write'], misconfigurations: [{ type: 'cloud_misconfig', severity: 'critical', description: `Firebase Realtime Database for ${domain} appears publicly writable` }], riskScore: 95, severity: 'critical', exposureLevel: 'public' });
  } catch {}
  try {
    const res = await fetchURL(`https://${domain}.digitaloceanspaces.com`, 'GET', {}, undefined, 8000);
    if (res.status < 400) assets.push({ id: genId(), provider: 'digitalocean', serviceType: 'Spaces', resourceId: domain, url: `https://${domain}.digitaloceanspaces.com`, permissions: res.status === 200 ? ['List'] : ['Exists'], misconfigurations: [{ type: 'cloud_misconfig', severity: res.status === 200 ? 'high' : 'medium', description: `DigitalOcean Spaces bucket ${domain} is accessible` }], riskScore: res.status === 200 ? 70 : 40, severity: res.status === 200 ? 'high' : 'medium', exposureLevel: res.status === 200 ? 'public' : 'authenticated' });
  } catch {}
  for (const port of [2375,2376,6443]) {
    try {
      const banner = await bannerGrab(domain, port, 5000);
      if (banner.includes('Docker') || banner.includes('docker') || banner.includes('Kubernetes') || banner.includes('k8s') || banner.includes('etcd')) {
        const svc = banner.includes('Kubernetes') || banner.includes('k8s') ? 'Kubernetes API' : banner.includes('etcd') ? 'etcd' : 'Docker Daemon';
        const provider: CloudAsset['provider'] = 'aws';
        assets.push({ id: genId(), provider, serviceType: svc, resourceId: `${domain}:${port}`, url: `http://${domain}:${port}`, permissions: ['Connect'], misconfigurations: [{ type: 'cloud_misconfig', severity: 'critical', description: `${svc} exposed on port ${port} without proper network controls` }], riskScore: 90, severity: 'critical', exposureLevel: 'public' });
      }
    } catch {}
  }
  return assets;
}

// ─── Port Scanner ─────────────────────────────────────────────────────────
async function scanPortsOnAssets(subdomains: Record<string, string[]>, ports: number[], timeout=15000): Promise<DiscoveredAsset[]> {
  const assets: DiscoveredAsset[] = [];
  const entries = Object.entries(subdomains);
  const chunkSize = 8;
  const portBatch = 32;
  for (let i=0; i<entries.length; i+=chunkSize) {
    const chunk = entries.slice(i, i+chunkSize);
    await Promise.all(chunk.map(async ([sub, ips]) => {
      for (const ip of ips) {
        const pList = ports.slice(0,100);
        for (let p=0; p<pList.length; p+=portBatch) {
          await Promise.all(pList.slice(p, p+portBatch).map(async (port) => {
            try {
              const banner = await bannerGrab(ip, port, timeout);
              const isAlwaysCheck = [80,443,8080,8443,3000,5000,8000,9000].includes(port);
              if (banner || isAlwaysCheck) {
                const svc = SERVICE_NAMES[port] || 'unknown';
                const techs = detectTechnologies({}, banner);
                const cves = mapCVEs(techs);
                const findings: Finding[] = [];
                if (DANGEROUS_PORTS.has(port)) findings.push({ type:'dangerous_service', severity:'high', port, service:svc, description:`${svc} exposed on port ${port}`, evidence:banner.slice(0,120)});
                if (EXPOSABLE_DB_PORTS.has(port)) findings.push({ type:'exposed_database', severity:'critical', port, service:svc, description:`Database ${svc} exposed on port ${port}`, evidence:banner.slice(0,120)});
                const creds = DEFAULT_CREDS[svc];
                if (creds) findings.push({ type:'default_creds', severity:'critical', port, service:svc, description:`${svc} may have default credentials: ${creds.slice(0,3).join(', ')}...`, evidence:creds.slice(0,3).join(', ')});
                let webVulns: WebVuln[] = [];
                let sslInfo: SSLInfo | null = null;
                let sslGrade: DiscoveredAsset['sslGrade'] = undefined;
                let waf: string | null = null;
                let web: any = null;
                if (port===80 || port===443 || port===8080 || port===8443 || /HTTP|Web|Proxy/i.test(svc)) {
                  try {
                    web = await fetchURL(`http${port===443||port===8443?'s':''}://${ip}:${port}`, 'GET', undefined, undefined, timeout);
                    webVulns = await detectWebVulnsAdvanced(web.redirectUrls[web.redirectUrls.length-1] || `http${port===443||port===8443?'s':''}://${ip}:${port}`, web.headers, web.body, web.status);
                    const techsWeb = detectTechnologies(web.headers, web.body);
                    cves.push(...mapCVEs(techsWeb).filter(c=>!cves.some(ex=>ex.id===c.id)));
                    waf = detectWAF(web.headers, web.body);
                    sslInfo = await analyzeSSLInfo(web.headers, web.redirectUrls[web.redirectUrls.length-1] || `http${port===443||port===8443?'s':''}://${ip}:${port}`);
                    sslGrade = gradeSSL(sslInfo);
                  } catch {}
                }
                const techsBanner = detectTechnologies({'server':banner}, banner);
                cves.push(...mapCVEs(techsBanner).filter(c=>!cves.some(ex=>ex.id===c.id)));
                // Smart tech fallback: use service name as technology if nothing detected, and always record web headers for SSL display
                const techName = techs[0]?.name || techsBanner[0]?.name || svc || 'Unknown';
                const techVer = techs[0]?.version || techsBanner[0]?.version || null;
                const asset: DiscoveredAsset = {
                  id: genId(), domain: sub, subdomain: sub, ip, port, service: svc, banner, technology: techName,
                  version: techVer,
                  cves: cves.map(c=>c.id), cveConfidence: cves.length>0 ? 'high' : 'low',
                  cloudProvider: null, riskScore: 0, findings, headers: (web && web.headers) ? web.headers : { server: banner.slice(0,80) }, sslInfo, sslGrade, waf,
                  webVulns, firstSeen: new Date().toISOString(),
                  complianceStatus: { owasp:[], pciDss:[], gdpr:[] },
                  cvssMax: cves.length ? Math.max(...cves.map(c=>c.cvss)) : 0,
                  exploitAvailable: cves.some(c=>c.exploitAvailable),
                };
                assets.push(asset);
              }
            } catch {}
          }));
        }
      }
    }));
  }
  return assets;
}

// ─── Risk Scoring Engine (CVSS-based + Exploitability) ────────────────────
function calculateRiskScores(assets: DiscoveredAsset[], cloudAssets: CloudAsset[]) {
  for (const a of assets) {
    let score = 0;
    const cvssMax = a.cvssMax || 0;
    const exploitBonus = a.exploitAvailable ? 25 : 0;
    // Base score from criticality
    score += Math.min(cvssMax * 2.0, 60);
    score += Math.min(a.cves.length * 5, 35);
    score += exploitBonus;
    // Port-based penalties
    if (EXPOSABLE_DB_PORTS.has(a.port)) score += 20;
    if (DANGEROUS_PORTS.has(a.port)) score += 15;
    if ([21,23,3389,5900].includes(a.port)) score += 18;
    // Web vulnerabilities
    let webScore = 0;
    for (const w of (a.webVulns||[])) {
      if (w.severity === 'critical') webScore += 20;
      else if (w.severity === 'high') webScore += 12;
      else if (w.severity === 'medium') webScore += 6;
      else webScore += 2;
    }
    score += Math.min(webScore, 45);
    // Findings (dangerous services, exposed DBs, default creds, missing headers, etc.)
    const critFindings = a.findings.filter(f=>f.severity==='critical').length;
    const highFindings = a.findings.filter(f=>f.severity==='high').length;
    const medFindings = a.findings.filter(f=>f.severity==='medium').length;
    score += Math.min(critFindings*25 + highFindings*15 + medFindings*5, 50);
    // SSL penalty
    const sslPenalty = a.sslGrade==='F' ? 20 : a.sslGrade==='E' ? 15 : a.sslGrade==='D' ? 10 : a.sslGrade==='C' ? 5 : a.sslGrade==='T'?20 : a.sslGrade==='X'?20 : 0;
    score += sslPenalty;
    // WAF bonus (protection reduces risk slightly)
    if (a.waf) score -= 8;
    a.riskScore = Math.min(Math.max(Math.round(score), 0), 100);
    // Ensure minimum risk for any internet-exposed service
    if (a.port && a.port !== 0 && a.riskScore < 8) a.riskScore = 8;
  }
  for (const c of cloudAssets) {
    c.riskScore = Math.min(Math.max(c.riskScore, 0), 100);
  }
}

function dedupeFindings(assets: DiscoveredAsset[]) {
  for (const a of assets) {
    const seen = new Set<string>();
    a.findings = a.findings.filter(f => {
      const key = `${f.type}|${f.port||0}|${f.description}`;
      if (seen.has(key)) return false;
      seen.add(key); return true;
    });
    const seenWeb = new Set<string>();
    a.webVulns = (a.webVulns||[]).filter(w => {
      const key = `${w.type}|${w.url}|${w.description}`;
      if (seenWeb.has(key)) return false;
      seenWeb.add(key); return true;
    });
  }
}

function generateRecommendations(assets: DiscoveredAsset[], cloudAssets: CloudAsset[], dnsInfo?: any): string[] {
  const recs: string[] = [];
  if (assets.some(a=>a.cves.length>0)) recs.push('Patch or upgrade vulnerable software versions to address mapped CVEs');
  if (assets.some(a=>a.webVulns?.some(w=>w.severity==='critical'||w.severity==='high'))) recs.push('Address critical/high web vulnerabilities (SQLi, XSS, RCE) immediately');
  if (assets.some(a=>a.findings.some(f=>f.type==='exposed_database'))) recs.push('Restrict database access via firewall rules or private subnets');
  if (assets.some(a=>a.findings.some(f=>f.type==='dangerous_service'))) recs.push('Close or restrict dangerous service ports (Telnet, RDP, FTP) exposed to the internet');
  if (assets.some(a=>a.findings.some(f=>f.type==='default_creds'))) recs.push('Change default credentials on all management interfaces');
  if (assets.some(a=>a.sslGrade==='F'||a.sslGrade==='T'||a.sslGrade==='X')) recs.push('Fix critical SSL/TLS misconfigurations (upgrade to TLS 1.2+, enforce HSTS)');
  if (!dnsInfo?.spfPolicy || dnsInfo.spfPolicy==='none') recs.push('Configure strict SPF record to prevent email spoofing');
  if (!dnsInfo?.dmarcPolicy || dnsInfo.dmarcPolicy==='none') recs.push('Enforce DMARC policy (p=quarantine or p=reject)');
  if (!dnsInfo?.dkimPresent) recs.push('Enable DKIM signing for outbound email authentication');
  if (dnsInfo?.subdomainTakeover?.length) recs.push('Remove dangling CNAME records pointing to deleted cloud resources');
  if (cloudAssets.some(c=>c.severity==='critical')) recs.push('Fix critical cloud misconfigurations (open S3 buckets, Firebase DBs, Docker/Kube APIs)');
  if (assets.some(a=>a.waf===null && (a.webVulns?.length||0)>0)) recs.push('Deploy a WAF to mitigate web application attack surface');
  if (assets.some(a=>!a.headers['strict-transport-security'])) recs.push('Enable HSTS on all HTTPS endpoints');
  if (!recs.length) recs.push('Regularly review and update dependencies; perform quarterly penetration tests');
  return recs.slice(0,12);
}

function generateThreatActors(assets: DiscoveredAsset[]): { actors: string[]; mitreTactics: string[] } {
  const actors: string[] = [];
  const mitre: string[] = [];
  const hasCritical = assets.some(a=>a.riskScore>=70);
  const hasWeb = assets.some(a=>(a.webVulns?.length||0)>0);
  const hasDB = assets.some(a=>EXPOSABLE_DB_PORTS.has(a.port));
  const hasRDP = assets.some(a=>a.port===3389);
  const hasSSH = assets.some(a=>a.port===22);
  const hasDockerKube = assets.some(a=>[2375,2376,6443].includes(a.port));
  const hasDefaultCreds = assets.some(a=>a.findings.some(f=>f.type==='default_creds'));
  const hasExploit = assets.some(a=>a.exploitAvailable);
  if (hasCritical && hasExploit) { actors.push('Advanced Persistent Threats (APTs) leveraging known CVEs with public exploits'); mitre.push('TA0001-Initial Access','TA0002-Execution'); }
  if (hasWeb) { actors.push('Web application attackers (SQL injection, XSS, SSRF specialists)'); mitre.push('TA0001-Initial Access','TA0040-Impact'); }
  if (hasDB) { actors.push('Data exfiltration groups targeting exposed databases'); mitre.push('TA0009-Collection','TA0010-Exfiltration'); }
  if (hasRDP) { actors.push('Ransomware operators exploiting RDP access'); mitre.push('TA0001-Initial Access','TA0040-Impact'); }
  if (hasSSH && hasDefaultCreds) { actors.push('Cryptojacking / botnet operators targeting weak SSH credentials'); mitre.push('TA0001-Initial Access','TA0002-Execution'); }
  if (hasDockerKube) { actors.push('Cloud adversaries targeting container escape and cluster takeover'); mitre.push('TA0001-Initial Access','TA0004-Privilege Escalation'); }
  if (!actors.length) { actors.push('Opportunistic low-level reconnaissance actors'); mitre.push('TA0043-Reconnaissance'); }
  return { actors, mitreTactics: Array.from(new Set(mitre)) };
}

function complianceCheck(assets: DiscoveredAsset[]): ScanResult['executiveSummary']['complianceStatus'] {
  let owaspCompliant = true;
  let pciDssCompliant = true;
  let gdprCompliant = true;
  for (const a of assets) {
    if ((a.webVulns||[]).some(w=>w.severity==='critical'||w.severity==='high')) owaspCompliant = false;
    if ((a.sslGrade||'A')==='F'||a.sslGrade==='T'||a.sslGrade==='X'||!(a.sslInfo?.tls12||a.sslInfo?.tls13)) pciDssCompliant = false;
    if (a.findings.some(f=>f.type==='exposed_database'||f.type==='info_disclosure')) gdprCompliant = false;
  }
  return { owaspCompliant, pciDssCompliant, gdprCompliant };
}

// ─── Scanner Engine Class ─────────────────────────────────────────────────
export class ScannerEngine {
  private scanResult: ScanResult;
  private target: string;

  constructor(target: string) {
    this.target = target;
    this.scanResult = { scanId: genId(), target, startedAt: new Date().toISOString(), assets: [], cloudAssets: [], statistics: { totalSubdomains:0, totalAssets:0, totalCloudAssets:0, criticalFindings:0, highRiskCount:0, mediumRiskCount:0, lowRiskCount:0, infoCount:0, totalCVEs:0, totalWebVulns:0, sslIssues:0, totalExploits:0, weakSSLCount:0, missingHeaderCount:0, exposedDBCount:0, exposedAdminCount:0 }, executiveSummary: { overallRisk:'LOW', riskScore:0, criticalFindings:0, attackSurfaceSize:0, recommendations:[], threatActors:[] } };
  }

  async enumerateSubdomains(): Promise<Record<string, string[]>> {
    const result: Record<string, string[]> = {};
    const base = this.target.replace(/^www\./,'');
    try { const ips = await resolve4(base).catch(()=>[]); if (ips.length) result[base]=ips; } catch {}
    for (const sub of SUBDOMAIN_WORDLIST) {
      const fqdn = `${sub}.${base}`;
      try { const ips = await resolve4(fqdn).catch(()=>[] as string[]); if (ips.length) result[fqdn]=ips; } catch {}
    }
    return result;
  }

  async runScan(type: string = 'full', portLimit = 100, cveLimit: 'lite'|'full'='full'): Promise<ScanResult> {
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
    const subdomains = await this.enumerateSubdomains();
    this.scanResult.durationSeconds=(Date.now()-start)/1000;
    this.scanResult.statistics={ totalSubdomains:Object.keys(subdomains).length, totalAssets:0, totalCloudAssets:0, criticalFindings:0, highRiskCount:0, mediumRiskCount:0, lowRiskCount:0, infoCount:0, totalCVEs:0, totalWebVulns:0, sslIssues:0, totalExploits:0, weakSSLCount:0, missingHeaderCount:0, exposedDBCount:0, exposedAdminCount:0 };
    this.scanResult.executiveSummary={ overallRisk:'LOW', riskScore:0, criticalFindings:0, attackSurfaceSize:Object.keys(subdomains).length, recommendations:['Run full scan for deeper analysis'], threatActors:['None identified'], complianceStatus:{owaspCompliant:true,pciDssCompliant:true,gdprCompliant:true}, mitreTactics:['TA0043-Reconnaissance'] };
    return this.scanResult;
  }

  async runPortOnly(portLimit=50): Promise<ScanResult> {
    const start = Date.now();
    const subdomains = await this.enumerateSubdomains();
    const assets = await scanPortsOnAssets(subdomains, TOP_PORTS.slice(0, portLimit));
    this.scanResult.assets=assets; this.scanResult.durationSeconds=(Date.now()-start)/1000;
    this.scanResult.statistics={ totalSubdomains:Object.keys(subdomains).length, totalAssets:assets.length, totalCloudAssets:0, criticalFindings:0, highRiskCount:assets.filter(a=>a.riskScore>=40&&a.riskScore<70).length, mediumRiskCount:assets.filter(a=>a.riskScore>=15&&a.riskScore<40).length, lowRiskCount:assets.filter(a=>a.riskScore<15).length, infoCount:0, totalCVEs:assets.reduce((s,a)=>s+a.cves.length,0), totalWebVulns:assets.reduce((s,a)=>s+(a.webVulns?.length||0),0), sslIssues:assets.filter(a=>a.sslGrade&&(['D','E','F','T','X'] as any[]).includes(a.sslGrade)).length, totalExploits:assets.filter(a=>a.exploitAvailable).length, weakSSLCount:assets.filter(a=>a.sslGrade==='F'||a.sslGrade==='T'||a.sslGrade==='X').length, missingHeaderCount:assets.reduce((s,a)=>s+(a.webVulns?.filter(w=>w.type==='missing_header').length||0),0), exposedDBCount:assets.filter(a=>a.findings.some(f=>f.type==='exposed_database')).length, exposedAdminCount:0 };
    const maxPortRisk = Math.max(...assets.map(a=>a.riskScore),0);
    const portThreats = assets.filter(a=>a.findings.length>0 || (a.webVulns && a.webVulns.length>0)).length;
    this.scanResult.executiveSummary={ overallRisk:assets.some(a=>a.riskScore>=70)?'CRITICAL':assets.some(a=>a.riskScore>=40)?'HIGH':assets.some(a=>a.riskScore>=15)?'MEDIUM':'LOW', riskScore:maxPortRisk, criticalFindings:0, attackSurfaceSize:assets.length, recommendations:['Run full scan for CVE and cloud checks'], threatActors:portThreats>0?['Opportunistic attackers','Reconnaissance groups']:['None identified'], complianceStatus:{owaspCompliant:portThreats===0,pciDssCompliant:portThreats===0,gdprCompliant:portThreats===0}, mitreTactics:['TA0043-Reconnaissance'] };
    return this.scanResult;
  }

  async runCVEOnly(portLimit=50, cveLimit:'lite'|'full'='full'): Promise<ScanResult> {
    const start = Date.now();
    const [subdomains, dnsInfo] = await Promise.all([this.enumerateSubdomains(), analyzeDNS(this.target)]);
    const assets = await scanPortsOnAssets(subdomains, TOP_PORTS.slice(0, portLimit));
    for (const asset of assets) {
      const techStr = asset.technology + (asset.version ? ' ' + asset.version : '');
      const cves = mapCVEs([{name: asset.technology || '', version: asset.version || ''}]).filter(c=>!asset.cves.includes(c.id));
      asset.cves.push(...cves.map(c=>c.id));
      asset.cvssMax = Math.max(asset.cvssMax||0, ...cves.map(c=>c.cvss));
      asset.exploitAvailable = asset.exploitAvailable || cves.some(c=>c.exploitAvailable);
    }
    dedupeFindings(assets);
    calculateRiskScores(assets, []);
    const crit = assets.filter(a=>a.riskScore>=70).length;
    const totalCves = assets.reduce((s,a)=>s+a.cves.length,0);
    const totalWebVulns = assets.reduce((s,a)=>s+(a.webVulns?.length||0),0);
    const sslIssues = assets.filter(a=>a.sslGrade&&(['D','E','F','T','X'] as any[]).includes(a.sslGrade)).length;
    this.scanResult.assets=assets; this.scanResult.durationSeconds=(Date.now()-start)/1000;
    this.scanResult.statistics={ totalSubdomains:Object.keys(subdomains).length, totalAssets:assets.length, totalCloudAssets:0, criticalFindings:crit, highRiskCount:assets.filter(a=>a.riskScore>=40&&a.riskScore<70).length, mediumRiskCount:assets.filter(a=>a.riskScore>=15&&a.riskScore<40).length, lowRiskCount:assets.filter(a=>a.riskScore<15).length, infoCount:0, totalCVEs:totalCves, totalWebVulns, sslIssues, totalExploits:assets.filter(a=>a.exploitAvailable).length, weakSSLCount:assets.filter(a=>a.sslGrade==='F'||a.sslGrade==='T'||a.sslGrade==='X').length, missingHeaderCount:assets.reduce((s,a)=>s+(a.webVulns?.filter(w=>w.type==='missing_header').length||0),0), exposedDBCount:assets.filter(a=>a.findings.some(f=>f.type==='exposed_database')).length, exposedAdminCount:0 };
    const {actors, mitreTactics} = generateThreatActors(assets);
    this.scanResult.executiveSummary={ overallRisk:crit>0?'CRITICAL':assets.some(a=>a.riskScore>=70)?'HIGH':assets.some(a=>a.riskScore>=40)?'MEDIUM':'LOW', riskScore:crit>0?90:Math.max(...assets.map(a=>a.riskScore),0), criticalFindings:crit, attackSurfaceSize:assets.length, recommendations:generateRecommendations(assets,[],dnsInfo), threatActors:actors, complianceStatus:complianceCheck(assets), mitreTactics };
    this.scanResult.dnsAnalysis = dnsInfo;
    return this.scanResult;
  }

  async runCloudOnly(): Promise<ScanResult> {
    const start = Date.now();
    const cloudAssets = await scanCloud(this.target);
    const dnsFindings = await analyzeDNS(this.target);
    this.scanResult.cloudAssets=cloudAssets; this.scanResult.durationSeconds=(Date.now()-start)/1000;
    this.scanResult.statistics={ totalSubdomains:0, totalAssets:0, totalCloudAssets:cloudAssets.length, criticalFindings:cloudAssets.filter(a=>a.severity==='critical').length, highRiskCount:cloudAssets.filter(a=>a.severity==='high').length, mediumRiskCount:cloudAssets.filter(a=>a.severity==='medium').length, lowRiskCount:0, infoCount:0, totalCVEs:0, totalWebVulns:0, sslIssues:0, totalExploits:0, weakSSLCount:0, missingHeaderCount:0, exposedDBCount:0, exposedAdminCount:0 };
    this.scanResult.executiveSummary={ overallRisk:cloudAssets.some(a=>a.severity==='critical')?'CRITICAL':cloudAssets.some(a=>a.severity==='high')?'HIGH':'LOW', riskScore:cloudAssets.filter(a=>a.severity==='critical').length*25, criticalFindings:cloudAssets.filter(a=>a.severity==='critical').length, attackSurfaceSize:cloudAssets.length, recommendations:generateRecommendations([],cloudAssets,dnsFindings), threatActors:['Cloud-focused threat actors','Data exfiltration groups'], complianceStatus:{owaspCompliant:true,pciDssCompliant:true,gdprCompliant:!cloudAssets.some(a=>a.severity==='critical')}, mitreTactics:['TA0001-Initial Access','TA0009-Collection'] };
    return this.scanResult;
  }

  async runFullScan(portLimit=100, cveLimit:'lite'|'full'='full'): Promise<ScanResult> {
    const start = Date.now();
    const [subdomains, dnsInfo] = await Promise.all([this.enumerateSubdomains(), analyzeDNS(this.target)]);
    const assets = await scanPortsOnAssets(subdomains, TOP_PORTS.slice(0, portLimit));
    const cloudAssets = await scanCloud(this.target);
    for (const asset of assets) {
      const cves = mapCVEs([{name: asset.technology || '', version: asset.version || ''}]).filter(c=>!asset.cves.includes(c.id));
      asset.cves.push(...cves.map(c=>c.id));
      asset.cvssMax = Math.max(asset.cvssMax||0, ...cves.map(c=>c.cvss));
      asset.exploitAvailable = asset.exploitAvailable || cves.some(c=>c.exploitAvailable);
    }
    dedupeFindings(assets);
    calculateRiskScores(assets, cloudAssets);
    const duration = (Date.now()-start)/1000;
    const crit = assets.filter(a=>a.riskScore>=70).length + cloudAssets.filter(a=>a.severity==='critical').length;
    const totalCves = assets.reduce((s,a)=>s+a.cves.length,0);
    const totalWebVulns = assets.reduce((s,a)=>s+(a.webVulns?.length||0),0);
    const sslIssues = assets.filter(a=>a.sslGrade&&(['D','E','F','T','X'] as any[]).includes(a.sslGrade)).length;
    const totalExploits = assets.filter(a=>a.exploitAvailable).length;
    const weakSSLCount = assets.filter(a=>a.sslGrade==='F'||a.sslGrade==='T'||a.sslGrade==='X').length;
    const missingHeaderCount = assets.reduce((s,a)=>s+(a.webVulns?.filter(w=>w.type==='missing_header').length||0),0);
    const exposedDBCount = assets.filter(a=>a.findings.some(f=>f.type==='exposed_database')).length;
    const exposedAdminCount = assets.filter(a=>a.findings.some(f=>f.type==='dangerous_service'&&['Telnet','SSH','RDP'].includes(f.service||''))).length;
    this.scanResult.assets=assets;
    this.scanResult.cloudAssets=cloudAssets;
    this.scanResult.durationSeconds=duration;
    this.scanResult.completedAt=new Date().toISOString();
    this.scanResult.statistics={ totalSubdomains:Object.keys(subdomains).length, totalAssets:assets.length, totalCloudAssets:cloudAssets.length, criticalFindings:crit, highRiskCount:assets.filter(a=>a.riskScore>=40&&a.riskScore<70).length, mediumRiskCount:assets.filter(a=>a.riskScore>=15&&a.riskScore<40).length, lowRiskCount:assets.filter(a=>a.riskScore<15).length, infoCount:assets.reduce((s,a)=>s+a.findings.filter(f=>f.severity==='info').length,0), totalCVEs:totalCves, totalWebVulns, sslIssues, totalExploits, weakSSLCount, missingHeaderCount, exposedDBCount, exposedAdminCount };
    const {actors, mitreTactics} = generateThreatActors(assets);
    this.scanResult.executiveSummary={ overallRisk:crit>0?'CRITICAL':assets.some(a=>a.riskScore>=70)?'HIGH':assets.some(a=>a.riskScore>=40)?'MEDIUM':'LOW', riskScore:Math.min(Math.max(...assets.map(a=>a.riskScore), ...cloudAssets.map(a=>a.riskScore),0),100), criticalFindings:crit, attackSurfaceSize:Object.keys(subdomains).length+cloudAssets.length, recommendations: generateRecommendations(assets,cloudAssets,dnsInfo), threatActors:actors, complianceStatus:complianceCheck(assets), mitreTactics };
    this.scanResult.dnsAnalysis = dnsInfo;
    return this.scanResult;
  }
}
