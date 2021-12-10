## 一、准备工作

添加账号（三台服务器）

 

```
useradd -r -m -s /bin/bash nudt
```

添加sudo权限 /etc/sudoers（三台服务器）

 

```
nudt  ALL=(ALL)                ALL
```

设置账号密码并切换到该用户（三台服务器）

 

```
passwd nudt
su - nudt
```

卸载原有golang并安装新版

 

```
sudo apt-get remove golang-go
sudo wget -P /usr/local https://studygolang.com/dl/golang/go1.15.linux-amd64.tar.gz
cd /usr/local
sudo tar -zxvf go1.15.linux-amd64.tar.gz
```

环境变量内容 ~/.bashrc

 

```
export GOROOT=/usr/local/go
export PATH=$PATH:$GOROOT/bin
export GOPATH=$HOME/go
export PATH=$PATH:/home/nudt/go/src/github.com/hyperledger/amops/bin
export FABRIC_CFG_PATH=/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment
```

\#配置阿里云的gpg

 

```
curl -fsSL https://mirrors.aliyun.com/docker-ce/linux/ubuntu/gpg | sudo apt-key add -
```

 

\#配置阿里云的docker镜像

 

```
sudo add-apt-repository "deb [arch=amd64] https://mirrors.aliyun.com/docker-ce/linux/ubuntu $(lsb_release -cs) stable"
```

\#执行安装命令安装docker相关工具

 

```
sudo apt-get install docker.io docker-compose
```

docker 权限设置

 

```
sudo chmod a+rw /var/run/docker.sock
```

## 二、网络部署

下载Fabric

 

```
sudo chown nudt:nudt /home/nudt/
cd /home/nudt
mkdir -p go/src/github.com/hyperledger
cd go/src/github.com/hyperledger
git clone https://github.com/hyperledger/fabric.git
cd fabric
git checkout -b remotes/origin/release-2.3
```

下载二进制可执行文件和关于Fabric的docker镜像

 

```
cd scripts/
./bootstrap.sh
如果网络访问有问题，执行以下命令
git config --global --unset http.proxy
```

建立多机部署文件夹

 

```
cd /home/nudt/go/src/github.com/hyperledger
mkdir amops
cd amops
mkdir multiple-deployment
cd /home/nudt/go/src/github.com/hyperledger/fabric/scripts
cp -r fabric-samples/bin /home/nudt/go/src/github.com/hyperledger/amops
```

设置Fabric服务的地址映射 sudo vim /etc/hosts 把以下内容填充至hosts文件中，IP需要按实际情况更改

 

```
124.71.195.158 agridepartorderer.amops.com
121.36.252.193 agrimacownerorderer.amops.com
121.37.143.236 financedepartorderer.amops.com
124.71.195.158 peer0.agridepart.amops.com
124.71.195.158 peer1.agridepart.amops.com
121.36.252.193 peer0.agrimacowner.amops.com
121.36.252.193 peer1.agrimacowner.amops.com
121.37.143.236 peer0.financedepart.amops.com
121.37.143.236 peer1.financedepart.amops.com
```

建立链码文件夹，部署链码

 

```
cd /home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment
mkdir -p chaincode/abstore
cp -r /home/nudt/go/src/github.com/hyperledger/fabric/scripts/fabric-samples/chaincode/abstore/go/ chaincode/abstore/
```

到链码文件夹下，下载链码的依赖文件

 

```
cd /home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/chaincode/abstore/go
go env -w GOPROXY=https://goproxy.cn,direct
go env -w GO111MODULE=on
go mod init
go mod vendor
```

在 服务器1 的multiple-deployment文件夹下新建crypto-config.yaml文件和configtx.yaml文件（证书密钥和交易配置文件），用于生产证书、密钥、创世区块等文件，注：服务器2、3不用建这两个文件

 

```
cd /home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment
touch crypto-config.yaml
touch configtx.yaml
```

文件内容对应如下 

crypto-config.yaml

 

```
OrdererOrgs:
  - Name: Orderer
    Domain: amops.com
    Specs:
      - Hostname: agridepartorderer
      - Hostname: agrimacownerorderer
      - Hostname: financedepartorderer
PeerOrgs:
  - Name: Agridepart
    Domain: agridepart.amops.com
    EnableNodeOUs: true
    Template:
      Count: 2 
    Users:
      Count: 1 
  - Name: Agrimacowner
    Domain: agrimacowner.amops.com
    EnableNodeOUs: true
    Template:
      Count: 2
    Users:
      Count: 1
  - Name: Financedepart
    Domain: financedepart.amops.com
    EnableNodeOUs: true
    Template:
      Count: 2
    Users:
      Count: 1
```

configtx.yaml

 

```
---
Organizations:
    - &OrdererOrg
        Name: OrdererOrg
        ID: OrdererMSP
        MSPDir: crypto-config/ordererOrganizations/amops.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Writers:
                Type: Signature
                Rule: "OR('OrdererMSP.member')"
            Admins:
                Type: Signature
                Rule: "OR('OrdererMSP.admin')"
    - &Agridepart
        Name: AgridepartMSP
        ID: AgridepartMSP
        MSPDir: crypto-config/peerOrganizations/agridepart.amops.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('AgridepartMSP.admin', 'AgridepartMSP.peer', 'AgridepartMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('AgridepartMSP.admin', 'AgridepartMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('AgridepartMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('AgridepartMSP.peer')"
        AnchorPeers:
            - Host: peer0.agridepart.amops.com
              Port: 7051
    - &Agrimacowner
        Name: AgrimacownerMSP
        ID: AgrimacownerMSP
        MSPDir: crypto-config/peerOrganizations/agrimacowner.amops.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('AgrimacownerMSP.admin', 'AgrimacownerMSP.peer', 'AgrimacownerMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('AgrimacownerMSP.admin', 'AgrimacownerMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('AgrimacownerMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('AgrimacownerMSP.peer')"
        AnchorPeers:
            - Host: peer0.agrimacowner.amops.com
              Port: 7051
    - &Financedepart
        Name: FinancedepartMSP
        ID: FinancedepartMSP
        MSPDir: crypto-config/peerOrganizations/financedepart.amops.com/msp
        Policies:
            Readers:
                Type: Signature
                Rule: "OR('FinancedepartMSP.admin', 'FinancedepartMSP.peer', 'FinancedepartMSP.client')"
            Writers:
                Type: Signature
                Rule: "OR('FinancedepartMSP.admin', 'FinancedepartMSP.client')"
            Admins:
                Type: Signature
                Rule: "OR('FinancedepartMSP.admin')"
            Endorsement:
                Type: Signature
                Rule: "OR('FinancedepartMSP.peer')"
        AnchorPeers:
            - Host: peer0.financedepart.amops.com
              Port: 7051
Capabilities:
    Channel: &ChannelCapabilities
        V2_0: true
    Orderer: &OrdererCapabilities
        V2_0: true
    Application: &ApplicationCapabilities
        V2_0: true
Application: &ApplicationDefaults
    Organizations:
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        LifecycleEndorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
        Endorsement:
            Type: ImplicitMeta
            Rule: "MAJORITY Endorsement"
    Capabilities:
        <<: *ApplicationCapabilities
Orderer: &OrdererDefaults
    OrdererType: etcdraft
    Addresses: # orderer 集群节点
        - agridepartorderer.amops.com:7050
        - agrimacownerorderer.amops.com:7050
        - financedepartorderer.amops.com:7050
    # Batch Timeout: The amount of time to wait before creating a batch
    BatchTimeout: 2s
    # Batch Size: Controls the number of messages batched into a block
    BatchSize:
        MaxMessageCount: 10
        AbsoluteMaxBytes: 99 MB
        PreferredMaxBytes: 512 KB
    Organizations:
    Policies:
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
        # BlockValidation specifies what signatures must be included in the block
        # from the orderer for the peer to validate it.
        BlockValidation:
            Type: ImplicitMeta
            Rule: "ANY Writers"
Channel: &ChannelDefaults
    Policies:
        # Who may invoke the 'Deliver' API
        Readers:
            Type: ImplicitMeta
            Rule: "ANY Readers"
        # Who may invoke the 'Broadcast' API
        Writers:
            Type: ImplicitMeta
            Rule: "ANY Writers"
        # By default, who may modify elements at this config level
        Admins:
            Type: ImplicitMeta
            Rule: "MAJORITY Admins"
    Capabilities:
        <<: *ChannelCapabilities
Profiles:
    ThreeOrgsChannel:
        Consortium: SampleConsortium
        <<: *ChannelDefaults
        Application:
            <<: *ApplicationDefaults
            Organizations:
                - *Agridepart
                - *Agrimacowner
                - *Financedepart
            Capabilities:
                <<: *ApplicationCapabilities
    SampleMultiNodeEtcdRaft:
        <<: *ChannelDefaults
        Capabilities:
            <<: *ChannelCapabilities
        Orderer:
            <<: *OrdererDefaults
            OrdererType: etcdraft
            EtcdRaft:
                Consenters:
                - Host: agridepartorderer.amops.com
                  Port: 7050
                  ClientTLSCert: crypto-config/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/tls/server.crt
                  ServerTLSCert: crypto-config/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/tls/server.crt
                - Host: agrimacownerorderer.amops.com
                  Port: 7050
                  ClientTLSCert: crypto-config/ordererOrganizations/amops.com/orderers/agrimacownerorderer.amops.com/tls/server.crt
                  ServerTLSCert: crypto-config/ordererOrganizations/amops.com/orderers/agrimacownerorderer.amops.com/tls/server.crt
                - Host: financedepartorderer.amops.com
                  Port: 7050
                  ClientTLSCert: crypto-config/ordererOrganizations/amops.com/orderers/financedepartorderer.amops.com/tls/server.crt
                  ServerTLSCert: crypto-config/ordererOrganizations/amops.com/orderers/financedepartorderer.amops.com/tls/server.crt
            Addresses:
                - agridepartorderer.amops.com:7050
                - agrimacownerorderer.amops.com:7050
                - financedepartorderer.amops.com:7050
            Organizations:
            - *OrdererOrg
            Capabilities:
                <<: *OrdererCapabilities
        Application:
            <<: *ApplicationDefaults
            Organizations:
            - <<: *OrdererOrg
        Consortiums:
            SampleConsortium:
                Organizations:
                - *Agridepart
                - *Agrimacowner
                - *Financedepart
```

服务器1的操作：生成证书、密钥、创世区块、各组织的交易配置文件等

 

```
cryptogen generate --config=./crypto-config.yaml
configtxgen -profile SampleMultiNodeEtcdRaft -channelID amopsdeploy -outputBlock ./channel-artifacts/genesis.block
configtxgen -profile ThreeOrgsChannel -outputCreateChannelTx ./channel-artifacts/channel.tx -channelID amops
configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/AgridepartMSPanchors.tx -channelID amops -asOrg AgridepartMSP
configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/AgrimacownerMSPanchors.tx -channelID amops -asOrg AgrimacownerMSP
configtxgen -profile ThreeOrgsChannel -outputAnchorPeersUpdate ./channel-artifacts/FinancedepartMSPanchors.tx -channelID amops -asOrg FinancedepartMSP
```

将channel-artifacts，crypto-config两个文件夹复制到服务器2和3的相同目录下

 

```
scp -r channel-artifacts 121.36.252.193:/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/
scp -r crypto-config 121.36.252.193:/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/
scp -r channel-artifacts 121.37.143.236:/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/
scp -r crypto-config 121.37.143.236:/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/
```

分别在三台服务器创建 docker-compose启动文件docker-compose-up.yaml

示例1如下：

 

```
version: '2'
services:
  ca.agridepart.amops.com:
    container_name: ca.agridepart.amops.com
    image: hyperledger/fabric-ca
    environment:
      - FABRIC_CA_HOME=/etc/hyperledger/fabric-ca-server
      - FABRIC_CA_SERVER_CA_NAME=ca.agridepart.amops.com
      - FABRIC_CA_SERVER_CA_CERTFILE=/etc/hyperledger/fabric-ca-server-config/ca.agridepart.amops.com-cert.pem
      - FABRIC_CA_SERVER_CA_KEYFILE=/etc/hyperledger/fabric-ca-server-config/priv_sk
      - FABRIC_CA_SERVER_TLS_ENABLED=true
      - FABRIC_CA_SERVER_TLS_CERTFILE=/etc/hyperledger/fabric-ca-server-tls/tlsca.agridepart.amops.com-cert.pem
      - FABRIC_CA_SERVER_TLS_KEYFILE=/etc/hyperledger/fabric-ca-server-tls/priv_sk
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/ca
    command: sh -c 'fabric-ca-server start -b admin:adminpw -d'
    volumes:
      - ./crypto-config/peerOrganizations/agridepart.amops.com/ca/:/etc/hyperledger/fabric-ca-server-config
      - ./crypto-config/peerOrganizations/agridepart.amops.com/tlsca/:/etc/hyperledger/fabric-ca-server-tls
    ports:
      - "7054:7054"
  agridepartorderer.amops.com:
    container_name: agridepartorderer.amops.com
    image: hyperledger/fabric-orderer
    environment:
      - FABRIC_LOGGING_SPEC=DEBUG
      - ORDERER_GENERAL_LISTENADDRESS=0.0.0.0
      - ORDERER_GENERAL_BOOTSTRAPMETHOD=file
      - ORDERER_GENERAL_BOOTSTRAPFILE=/var/hyperledger/orderer/orderer.genesis.block
      - ORDERER_GENERAL_LOCALMSPID=OrdererMSP
      - ORDERER_GENERAL_LOCALMSPDIR=/var/hyperledger/orderer/msp
      # enabled TLS
      - ORDERER_GENERAL_TLS_ENABLED=true
      - ORDERER_GENERAL_TLS_PRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_TLS_CERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_TLS_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
      - ORDERER_GENERAL_CLUSTER_CLIENTCERTIFICATE=/var/hyperledger/orderer/tls/server.crt
      - ORDERER_GENERAL_CLUSTER_CLIENTPRIVATEKEY=/var/hyperledger/orderer/tls/server.key
      - ORDERER_GENERAL_CLUSTER_ROOTCAS=[/var/hyperledger/orderer/tls/ca.crt]
      - ORDERER_OPERATIONS_LISTENADDRESS=0.0.0.0:8443
      - ORDERER_METRICS_PROVIDER=prometheus
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric
    command: orderer
    volumes:
        - ./channel-artifacts/genesis.block:/var/hyperledger/orderer/orderer.genesis.block
        - ./crypto-config/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp:/var/hyperledger/orderer/msp
        - ./crypto-config/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/tls/:/var/hyperledger/orderer/tls
    ports:
      - 7050:7050
    extra_hosts:
      - "agridepartorderer.amops.com:124.71.195.158"
      - "agrimacownerorderer.amops.com:121.36.252.193"
      - "financedepartorderer.amops.com:121.37.143.236"
  peer0.agridepart.amops.com:
    container_name: peer0.agridepart.amops.com
    image: hyperledger/fabric-peer
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_PEER_ID=peer0.agridepart.amops.com
      - CORE_PEER_ADDRESS=peer0.agridepart.amops.com:7051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:7051
      - CORE_PEER_CHAINCODEADDRESS=peer0.agridepart.amops.com:7052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:7052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer0.agridepart.amops.com:7051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer0.agridepart.amops.com:7051
      - CORE_PEER_LOCALMSPID=AgridepartMSP
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
      # Allow more time for chaincode container to build on install.
      - CORE_CHAINCODE_EXECUTETIMEOUT=300s
      - CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:9443
      - CORE_METRICS_PROVIDER=prometheus
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    volumes:
       - /var/run/:/host/var/run/
       - ./crypto-config/peerOrganizations/agridepart.amops.com/peers/peer0.agridepart.amops.com/msp:/etc/hyperledger/fabric/msp
       - ./crypto-config/peerOrganizations/agridepart.amops.com/peers/peer0.agridepart.amops.com/tls:/etc/hyperledger/fabric/tls
    ports:
      - 7051:7051
      - 7052:7052
      - 7053:7053
    extra_hosts:
      - "agridepartorderer.amops.com:124.71.195.158"
      - "agrimacownerorderer.amops.com:121.36.252.193"
      - "financedepartorderer.amops.com:121.37.143.236"
  peer1.agridepart.amops.com:
    container_name: peer1.agridepart.amops.com
    image: hyperledger/fabric-peer
    environment:
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      - CORE_PEER_ID=peer1.agridepart.amops.com
      - CORE_PEER_ADDRESS=peer1.agridepart.amops.com:8051
      - CORE_PEER_LISTENADDRESS=0.0.0.0:8051
      - CORE_PEER_CHAINCODEADDRESS=peer1.agridepart.amops.com:8052
      - CORE_PEER_CHAINCODELISTENADDRESS=0.0.0.0:8052
      - CORE_PEER_GOSSIP_BOOTSTRAP=peer1.agridepart.amops.com:8051
      - CORE_PEER_GOSSIP_EXTERNALENDPOINT=peer1.agridepart.amops.com:8051
      - CORE_PEER_LOCALMSPID=AgridepartMSP
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_GOSSIP_USELEADERELECTION=true
      - CORE_PEER_GOSSIP_ORGLEADER=false
      - CORE_PEER_PROFILE_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/etc/hyperledger/fabric/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/etc/hyperledger/fabric/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/etc/hyperledger/fabric/tls/ca.crt
      # Allow more time for chaincode container to build on install.
      - CORE_CHAINCODE_EXECUTETIMEOUT=300s
      - CORE_OPERATIONS_LISTENADDRESS=0.0.0.0:10443
      - CORE_METRICS_PROVIDER=prometheus
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: peer node start
    volumes:
       - /var/run/:/host/var/run/
       - ./crypto-config/peerOrganizations/agridepart.amops.com/peers/peer1.agridepart.amops.com/msp:/etc/hyperledger/fabric/msp
       - ./crypto-config/peerOrganizations/agridepart.amops.com/peers/peer1.agridepart.amops.com/tls:/etc/hyperledger/fabric/tls
    ports:
      - 8051:8051
      - 8052:8052
      - 8053:8053
    extra_hosts:
      - "agridepartorderer.amops.com:124.71.195.158"
      - "agrimacownerorderer.amops.com:121.36.252.193"
      - "financedepartorderer.amops.com:121.37.143.236"
  cli1:
    container_name: cli1
    image: hyperledger/fabric-tools
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      #- FABRIC_LOGGING_SPEC=DEBUG
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli1
      - CORE_PEER_ADDRESS=peer0.agridepart.amops.com:7051
      - CORE_PEER_LOCALMSPID=AgridepartMSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/peers/peer0.agridepart.amops.com/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/peers/peer0.agridepart.amops.com/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/peers/peer0.agridepart.amops.com/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/users/Admin@agridepart.amops.com/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
        - /var/run/:/host/var/run/
        - ./chaincode/abstore/go/:/opt/gopath/src/github.com/hyperledger/multiple-deployment/chaincode/abstore/go
        - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
        - ./channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
    extra_hosts:
      - "agridepartorderer.amops.com:124.71.195.158"
      - "agrimacownerorderer.amops.com:121.36.252.193"
      - "financedepartorderer.amops.com:121.37.143.236"
      - "peer0.agridepart.amops.com:124.71.195.158"
      - "peer1.agridepart.amops.com:124.71.195.158"
      - "peer0.agrimacowner.amops.com:121.36.252.193"
      - "peer1.agrimacowner.amops.com:121.36.252.193"
      - "peer0.financedepart.amops.com:121.37.143.236"
      - "peer1.financedepart.amops.com:121.37.143.236"
  cli2:
    container_name: cli2
    image: hyperledger/fabric-tools
    tty: true
    stdin_open: true
    environment:
      - GOPATH=/opt/gopath
      - CORE_VM_ENDPOINT=unix:///host/var/run/docker.sock
      #- FABRIC_LOGGING_SPEC=DEBUG
      - FABRIC_LOGGING_SPEC=INFO
      - CORE_PEER_ID=cli2
      - CORE_PEER_ADDRESS=peer1.agridepart.amops.com:8051
      - CORE_PEER_LOCALMSPID=AgridepartMSP
      - CORE_PEER_TLS_ENABLED=true
      - CORE_PEER_TLS_CERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/peers/peer1.agridepart.amops.com/tls/server.crt
      - CORE_PEER_TLS_KEY_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/peers/peer1.agridepart.amops.com/tls/server.key
      - CORE_PEER_TLS_ROOTCERT_FILE=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/peers/peer1.agridepart.amops.com/tls/ca.crt
      - CORE_PEER_MSPCONFIGPATH=/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/users/Admin@agridepart.amops.com/msp
    working_dir: /opt/gopath/src/github.com/hyperledger/fabric/peer
    command: /bin/bash
    volumes:
        - /var/run/:/host/var/run/
        - ./chaincode/abstore/go/:/opt/gopath/src/github.com/hyperledger/multiple-deployment/chaincode/abstore/go
        - ./crypto-config:/opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/
        - ./channel-artifacts:/opt/gopath/src/github.com/hyperledger/fabric/peer/channel-artifacts
    extra_hosts:
      - "agridepartorderer.amops.com:124.71.195.158"
      - "agrimacownerorderer.amops.com:121.36.252.193"
      - "financedepartorderer.amops.com:121.37.143.236"
      - "peer0.agridepart.amops.com:124.71.195.158"
      - "peer1.agridepart.amops.com:124.71.195.158"
      - "peer0.agrimacowner.amops.com:121.36.252.193"
      - "peer1.agrimacowner.amops.com:121.36.252.193"
      - "peer0.financedepart.amops.com:121.37.143.236"
      - "peer1.financedepart.amops.com:121.37.143.236"
```

然后在三台服务器分别启动docker-compose

 

```
docker-compose -f docker-compose-up.yaml up -d
```

查看docker进程

![img](file:///C:/Users/zhouqunjie/Documents/My Knowledge/temp/f1bfe9b0-7fb0-11eb-a361-91f069c9aebb/128/index_files/1622699260968-9gt.png)

服务器1的操作：创建通道，更新组织1锚节点docker exec -it cli1 bash

peer channel create -o agridepartorderer.amops.com:7050 -c amops -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem

peer channel join -b amops.block

peer channel update -o agridepartorderer.amops.com:7050 -c amops -f ./channel-artifacts/AgridepartMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem

exit

 

```
docker exec -it cli1 bash
peer channel create -o agridepartorderer.amops.com:7050 -c amops -f ./channel-artifacts/channel.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem
peer channel join -b amops.block
peer channel update -o agridepartorderer.amops.com:7050 -c amops -f ./channel-artifacts/AgridepartMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem
exit
```

退出cli1容器后，将区块文件amops.block从容器中拷贝出来，拷贝至cli2容器中，使peer1也加入区块中

 

```
docker cp cli1:/opt/gopath/src/github.com/hyperledger/fabric/peer/amops.block ./
docker cp amops.block cli2:/opt/gopath/src/github.com/hyperledger/fabric/peer/
docker exec -it cli2 bash
peer channel join -b amops.block
exit
```

将amops.block拷贝至服务器2、3

 

```
scp amops.block 121.36.252.193:/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/channel-artifacts/
scp amops.block 121.37.143.236:/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/channel-artifacts/
```

服务器2的操作：节点0、1加入通道，并更新组织2的锚节点

 

```
docker cp amops.block cli1:/opt/gopath/src/github.com/hyperledger/fabric/peer/
docker cp amops.block cli2:/opt/gopath/src/github.com/hyperledger/fabric/peer/
docker exec -it cli1 bash
peer channel join -b amops.block
peer channel update -o agrimacownerorderer.amops.com:7050 -c amops -f ./channel-artifacts/AgrimacownerMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agrimacownerorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem
exit
docker exec -it cli2 bash
peer channel join -b amops.block
exit
```

服务器3的操作：节点0、1加入通道，并更新组织3的锚节点

 

```
docker cp amops.block cli1:/opt/gopath/src/github.com/hyperledger/fabric/peer/
docker cp amops.block cli2:/opt/gopath/src/github.com/hyperledger/fabric/peer/
docker exec -it cli1 bash
peer channel join -b amops.block
peer channel update -o financedepartorderer.amops.com:7050 -c amops -f ./channel-artifacts/FinancedepartMSPanchors.tx --tls --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/financedepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem
exit
docker exec -it cli2 bash
peer channel join -b amops.block
exit
```

## 三、链码部署

服务器1、2、3的操作：peer0、peer1打包并安装链码

 

```
docker cp /home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/chaincode/record cli1:/opt/gopath/src/github.com/hyperledger/multiple-deployment/chaincode
docker exec -it cli1 bash
peer lifecycle chaincode package /opt/gopath/src/github.com/hyperledger/fabric/peer/record.tar.gz --path github.com/hyperledger/multiple-deployment/chaincode/record/go --lang golang --label record_1
peer lifecycle chaincode install /opt/gopath/src/github.com/hyperledger/fabric/peer/record.tar.gz
exit
docker cp cli1:/opt/gopath/src/github.com/hyperledger/fabric/peer/record.tar.gz ./
docker cp record.tar.gz cli2:/opt/gopath/src/github.com/hyperledger/fabric/peer/
docker exec -it cli2 bash
peer lifecycle chaincode install record.tar.gz
exit
```

服务器1、2、3的操作：锚节点同意提交链码

 

```
docker exec -it cli1 bash
peer lifecycle chaincode approveformyorg --channelID amops --name record --version 1.0 --init-required --package-id record_1:bda1cdff651b601802405bee520a5ffe091db2d8674de21d9e80fc1240f36781 --sequence 1 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem
peer lifecycle chaincode approveformyorg --channelID amops --name record --version 1.0 --init-required --package-id record_1:bda1cdff651b601802405bee520a5ffe091db2d8674de21d9e80fc1240f36781 --sequence 1 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agrimacownerorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem
peer lifecycle chaincode approveformyorg --channelID amops --name record --version 1.0 --init-required --package-id record_1:bda1cdff651b601802405bee520a5ffe091db2d8674de21d9e80fc1240f36781 --sequence 1 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/financedepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem
```

使用任一服务器操作都可：查看链码状态是否就绪

 

```
peer lifecycle chaincode checkcommitreadiness --channelID amops --name record --version 1.0 --init-required --sequence 1 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem --output json
```

使用任一服务器的锚节点操作都可：提交链码

 

```
peer lifecycle chaincode commit -o agridepartorderer.amops.com:7050 --channelID amops --name record --version 1.0 --sequence 1 --init-required --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem --peerAddresses peer0.agridepart.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/peers/peer0.agridepart.amops.com/tls/ca.crt --peerAddresses peer0.agrimacowner.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agrimacowner.amops.com/peers/peer0.agrimacowner.amops.com/tls/ca.crt --peerAddresses peer0.financedepart.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/financedepart.amops.com/peers/peer0.financedepart.amops.com/tls/ca.crt
```

使用任一服务器的锚节点操作都可：初始化链码

 

```
peer chaincode invoke -o agridepartorderer.amops.com:7050 --isInit --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem -C amops -n record --peerAddresses peer0.agridepart.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/peers/peer0.agridepart.amops.com/tls/ca.crt --peerAddresses peer0.agrimacowner.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agrimacowner.amops.com/peers/peer0.agrimacowner.amops.com/tls/ca.crt --peerAddresses peer0.financedepart.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/financedepart.amops.com/peers/peer0.financedepart.amops.com/tls/ca.crt -c '{"Args":["InitLedger"]}'
```

使用任一服务器操作都可：与链码进行交互

写入账本

 

```
peer chaincode invoke -o agridepartorderer.amops.com:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem -C amops -n record --peerAddresses peer0.agridepart.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agridepart.amops.com/peers/peer0.agridepart.amops.com/tls/ca.crt --peerAddresses peer0.agrimacowner.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agrimacowner.amops.com/peers/peer0.agrimacowner.amops.com/tls/ca.crt --peerAddresses peer0.financedepart.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/financedepart.amops.com/peers/peer0.financedepart.amops.com/tls/ca.crt -c '{"Args":["Insert","JCCE","{\"transID\":2,\"reqType\":\"cal\",\"switch\":\"17\",\"bandwidth\":18,\"secyGroup\":\"19\"}"]}' 
```

查询账本

 

```
peer chaincode invoke -o agrimacownerorderer.amops.com:7050 --tls true --cafile /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/ordererOrganizations/amops.com/orderers/agridepartorderer.amops.com/msp/tlscacerts/tlsca.amops.com-cert.pem -C amops -n record --peerAddresses peer0.agrimacowner.amops.com:7051 --tlsRootCertFiles /opt/gopath/src/github.com/hyperledger/fabric/peer/crypto/peerOrganizations/agrimacowner.amops.com/peers/peer0.agrimacowner.amops.com/tls/ca.crt -c  '{"Args":["Query","JCCE"]}'
```

## 四、搭建Explorer

先拉取explorer镜像

 

```
git clone https://github.com/hyperledger/blockchain-explorer.git
cd blockchain-explorer
```

数据库设置

修改~/blockchain-explorer/app/explorer.json以更新Postgresql数据库设置

内容如下

 

```
{
    "persistence": "postgreSQL",
    "platforms": ["fabric"],
    "postgreSQL": {
        "host": "127.0.0.1",
        "port": "5432",
        "database": "fabricexplorer",
        "username": "hppoc",
        "passwd": "Nudt996"
    },
    "sync": {
        "type": "local",
        "platform": "fabric",
        "blocksSyncTime": "1"
    },
    "jwt": {
        "secret": "a secret phrase!!",
        "expiresIn": "2h"
    }
}
```

修改DB文件夹的权限

 

```
chmod 775 /home/nudt/blockchain-explorer/app/persistence/fabric/postgreSQL/db
```

更新配置

修改`app/platform/fabric/config.json`以定义网络连接配置文件：

 

```
{
    "network-configs": {
        "agridepart-network": {
            "name": "agridepart-network",
            "profile": "./connection-profile/agridepart-network.json"
        },
        "agrimacowner-network": {
            "name": "agrimacowner-network",
            "profile": "./connection-profile/agrimacowner-network.json"
        },
        "financedepart-network": {
            "name": "financedepart-network",
            "profile": "./connection-profile/financedepart-network.json"
        }
    },
    "license": "Apache-2.0"
}
```

- `first-network` 是连接配置文件的名称，可以更改为任何名称
- `name` 是您要为网络指定的名称
- `profile` 是连接配置文件的位置

修改JSON文件中的连接配置文件`app/platform/fabric/connection-profile/agridepart-network.json`

 

```
{
    "name": "agridepart-network",
    "version": "1.0.0",
    "license": "Apache-2.0",
    "client": {
        "tlsEnable": true,
        "adminCredential": {
            "id": "exploreradmin",
            "password": "exploreradminpw"
        },
        "enableAuthentication": true,
        "organization": "AgridepartMSP",
        "connection": {
            "timeout": {
                "peer": {
                    "endorser": "300"
                },
                "orderer": "300"
            }
        }
    },
    "channels": {
        "amops": {
            "peers": {
                "peer0.agridepart.amops.com": {}
            },
            "connection": {
                "timeout": {
                    "peer": {
                        "endorser": "6000",
                        "eventHub": "6000",
                        "eventReg": "6000"
                    }
                }
            }
        }
    },
    "organizations": {
        "AgridepartMSP": {
            "mspid": "AgridepartMSP",
            "adminPrivateKey": {
                "path": "/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/crypto-config/peerOrganizations/agridepart.amops.com/users/Admin@agridepart.amops.com/msp/keystore/priv_sk"
            },
            "peers": ["peer0.agridepart.amops.com"],
            "signedCert": {
                "path": "/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/crypto-config/peerOrganizations/agridepart.amops.com/users/Admin@agridepart.amops.com/msp/signcerts/Admin@agridepart.amops.com-cert.pem"
            }
        }
    },
    "peers": {
        "peer0.agridepart.amops.com": {
            "tlsCACerts": {
                "path": "/home/nudt/go/src/github.com/hyperledger/amops/multiple-deployment/crypto-config/peerOrganizations/agridepart.amops.com/users/Admin@agridepart.amops.com/tls/ca.crt"
            },
            "url": "grpcs://peer0.agridepart.amops.com:7051",
            "grpcOptions": {
                "ssl-target-name-override": "peer0.agridepart.amops.com"
            }
        }
    }
}
fabric-path在first-network.json文件中更改为网络磁盘路径
提供adminPrivateKey config选项的完整磁盘路径，它通常以结尾_sk，例如： /fabric-path/fabric-samples/first-network/crypto-config/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp/keystore/aaacd899a6362a5c8cc1e6f86d13bfccc777375365bbda9c710bb7119993d71c_skadminUser并且adminPassword是Explorer的用户登录仪表板的凭据enableAuthentication 是用于使用登录页面启用身份验证的标志，设置为false将跳过身份验证
```

其余两个组织类似修改

运行创建数据库脚本：

注意需要先安装jq、postgresql，通过apt命令安装即可

 

```
sudo apt install jq
sudo apt install postgresql
```

nodejs安装指定的12.16版本

 

```
sudo cd /opt
wget https://nodejs.org/dist/v12.16.0/node-v12.16.0-linux-x64.tar.gz
tar -xf node-v12.16.0-linux-x64.tar.gz
mv node-v12.16.0-linux-x64 node
sudo ln -s /opt/node/bin/npm   /usr/local/bin/
sudo ln -s /opt/node/bin/node /usr/local/bin/
node -v
```

![img](file:///C:/Users/zhouqunjie/Documents/My Knowledge/temp/f1bfe9b0-7fb0-11eb-a361-91f069c9aebb/128/index_files/1622696242694-qku.png)

创建数据库

 

```
cd blockchain-explorer/app/persistence/fabric/postgreSQL/db
./createdb.sh
```

![img](file:///C:/Users/zhouqunjie/Documents/My Knowledge/temp/f1bfe9b0-7fb0-11eb-a361-91f069c9aebb/128/index_files/1622696316437-pqq.png)

连接到PostgreSQL数据库并运行数据库状态命令：

 

```
sudo -u postgres psql -c '\l'
sudo -u postgres psql fabricexplorer -c '\d'
```

![img](file:///C:/Users/zhouqunjie/Documents/My Knowledge/temp/f1bfe9b0-7fb0-11eb-a361-91f069c9aebb/128/index_files/1622696393186-umn.png)

![img](file:///C:/Users/zhouqunjie/Documents/My Knowledge/temp/f1bfe9b0-7fb0-11eb-a361-91f069c9aebb/128/index_files/1622696457175-qec.png)

安装，运行测试和构建项目

 

```
cd ~/blockchain-explorer 
./main.sh install
清理环境命令 
./main.sh clean
```

然后启动服务

 

```
npm start
```

访问ip:8080端口即可访问Explorer服务

http://124.70.140.196:8080 

账号密码配置在app/platform/fabric/connection-profile/first-network.json文件中 exploreradmin/exploreradminpw

![img](file:///C:/Users/zhouqunjie/Documents/My Knowledge/temp/f1bfe9b0-7fb0-11eb-a361-91f069c9aebb/128/index_files/e7966e64-ad0d-4e99-90f1-5039da22d2bb.png)

![img](file:///C:/Users/zhouqunjie/Documents/My Knowledge/temp/f1bfe9b0-7fb0-11eb-a361-91f069c9aebb/128/index_files/49e8dbe7-4e45-41ae-b4ce-86daff6f5635.png)

过程中遇到的错误及解决方案参考

错误1：创建通道时报网络错误 https://blog.csdn.net/qq_38388811/article/details/109711596

https://www.cnblogs.com/zoujiaojiao/p/13361475.html

关闭防火墙，重新生成证书、密钥、创世区块和配置文件

报错2：https://my.oschina.net/u/4290907/blog/3262607

发现是docker-compose-up配置文件编写有问题，清空并重启docker

 

```
docker-compose -f docker-compose-up.yaml down --volumes --remove-orphans
docker rm -f $(docker ps -a | grep "hyperledger/*" | awk "{print \$1}")
docker volume prune
```