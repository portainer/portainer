module github.com/portainer/portainer/api

go 1.19

require (
	github.com/Masterminds/semver v1.5.0
	github.com/Microsoft/go-winio v0.5.1
	github.com/VictoriaMetrics/fastcache v1.12.0
	github.com/asaskevich/govalidator v0.0.0-20200428143746-21a406dcc535
	github.com/aws/aws-sdk-go-v2 v1.11.1
	github.com/aws/aws-sdk-go-v2/credentials v1.6.2
	github.com/aws/aws-sdk-go-v2/service/ecr v1.10.1
	github.com/cbroglie/mustache v1.4.0
	github.com/coreos/go-semver v0.3.0
	github.com/dchest/uniuri v0.0.0-20160212164326-8902c56451e9
	github.com/docker/cli v20.10.9+incompatible
	github.com/docker/docker v20.10.16+incompatible
	github.com/fvbommel/sortorder v1.0.2
	github.com/fxamacker/cbor/v2 v2.3.0
	github.com/g07cha/defender v0.0.0-20180505193036-5665c627c814
	github.com/go-git/go-git/v5 v5.3.0
	github.com/go-ldap/ldap/v3 v3.1.8
	github.com/go-playground/validator/v10 v10.10.1
	github.com/gofrs/uuid v4.0.0+incompatible
	github.com/golang-jwt/jwt/v4 v4.2.0
	github.com/google/go-cmp v0.5.8
	github.com/gorilla/handlers v1.5.1
	github.com/gorilla/mux v1.7.3
	github.com/gorilla/securecookie v1.1.1
	github.com/gorilla/websocket v1.5.0
	github.com/hashicorp/golang-lru v0.5.4
	github.com/joho/godotenv v1.3.0
	github.com/jpillora/chisel v0.0.0-20190724232113-f3a8df20e389
	github.com/json-iterator/go v1.1.12
	github.com/koding/websocketproxy v0.0.0-20181220232114-7ed82d81a28c
	github.com/orcaman/concurrent-map v0.0.0-20190826125027-8c72a8bb44f6
	github.com/patrickmn/go-cache v2.1.0+incompatible
	github.com/pkg/errors v0.9.1
	github.com/portainer/docker-compose-wrapper v0.0.0-20221215210951-2c30d1b17a27
	github.com/portainer/libcrypto v0.0.0-20220506221303-1f4fb3b30f9a
	github.com/portainer/libhttp v0.0.0-20230206214615-dabd58de9f44
	github.com/portainer/portainer/pkg/featureflags v0.0.0-20230209201943-d73622ed9cd4
	github.com/portainer/portainer/pkg/libhelm v0.0.0-20221201012749-4fee35924724
	github.com/portainer/portainer/third_party/digest v0.0.0-20221201002639-8fd0efa34f73
	github.com/robfig/cron/v3 v3.0.1
	github.com/rs/zerolog v1.29.0
	github.com/stretchr/testify v1.8.1
	github.com/viney-shih/go-lock v1.1.1
	go.etcd.io/bbolt v1.3.6
	golang.org/x/crypto v0.0.0-20220315160706-3147a52a75dd
	golang.org/x/oauth2 v0.0.0-20211104180415-d3ed0bb246c8
	golang.org/x/sync v0.0.0-20210220032951-036812b2e83c
	gopkg.in/alecthomas/kingpin.v2 v2.2.6
	gopkg.in/yaml.v3 v3.0.1
	k8s.io/api v0.25.3
	k8s.io/apimachinery v0.25.3
	k8s.io/client-go v0.25.3
	software.sslmate.com/src/go-pkcs12 v0.0.0-20210415151418-c5206de65a78
)

require (
	github.com/PuerkitoBio/purell v1.1.1 // indirect
	github.com/PuerkitoBio/urlesc v0.0.0-20170810143723-de5bf2ad4578 // indirect
	github.com/alecthomas/template v0.0.0-20190718012654-fb15b899a751 // indirect
	github.com/alecthomas/units v0.0.0-20210208195552-ff826a37aa15 // indirect
	github.com/andrew-d/go-termutil v0.0.0-20150726205930-009166a695a2 // indirect
	github.com/armon/go-socks5 v0.0.0-20160902184237-e75332964ef5 // indirect
	github.com/aws/aws-sdk-go-v2/internal/configsources v1.1.1 // indirect
	github.com/aws/aws-sdk-go-v2/internal/endpoints/v2 v2.0.1 // indirect
	github.com/aws/smithy-go v1.9.0 // indirect
	github.com/cespare/xxhash/v2 v2.1.2 // indirect
	github.com/davecgh/go-spew v1.1.1 // indirect
	github.com/docker/distribution v2.8.1+incompatible // indirect
	github.com/docker/go-connections v0.4.0 // indirect
	github.com/docker/go-units v0.4.0 // indirect
	github.com/emicklei/go-restful/v3 v3.8.0 // indirect
	github.com/emirpasic/gods v1.12.0 // indirect
	github.com/evanphx/json-patch v4.12.0+incompatible // indirect
	github.com/felixge/httpsnoop v1.0.1 // indirect
	github.com/fsnotify/fsnotify v1.5.1 // indirect
	github.com/go-asn1-ber/asn1-ber v1.3.1 // indirect
	github.com/go-git/gcfg v1.5.0 // indirect
	github.com/go-git/go-billy/v5 v5.1.0 // indirect
	github.com/go-logr/logr v1.2.3 // indirect
	github.com/go-openapi/jsonpointer v0.19.5 // indirect
	github.com/go-openapi/jsonreference v0.19.5 // indirect
	github.com/go-openapi/swag v0.19.14 // indirect
	github.com/go-playground/locales v0.14.0 // indirect
	github.com/go-playground/universal-translator v0.18.0 // indirect
	github.com/gogo/protobuf v1.3.2 // indirect
	github.com/golang/protobuf v1.5.2 // indirect
	github.com/golang/snappy v0.0.4 // indirect
	github.com/google/gnostic v0.5.7-v3refs // indirect
	github.com/google/gofuzz v1.2.0 // indirect
	github.com/google/shlex v0.0.0-20191202100458-e7afc7fbc510 // indirect
	github.com/imdario/mergo v0.3.12 // indirect
	github.com/jbenet/go-context v0.0.0-20150711004518-d14ea06fba99 // indirect
	github.com/jmespath/go-jmespath v0.4.0 // indirect
	github.com/josharian/intern v1.0.0 // indirect
	github.com/jpillora/ansi v1.0.2 // indirect
	github.com/jpillora/requestlog v1.0.0 // indirect
	github.com/jpillora/sizestr v1.0.0 // indirect
	github.com/kevinburke/ssh_config v0.0.0-20201106050909-4977a11b4351 // indirect
	github.com/leodido/go-urn v1.2.1 // indirect
	github.com/mailru/easyjson v0.7.6 // indirect
	github.com/mattn/go-colorable v0.1.13 // indirect
	github.com/mattn/go-isatty v0.0.17 // indirect
	github.com/mitchellh/go-homedir v1.1.0 // indirect
	github.com/mitchellh/mapstructure v1.1.2 // indirect
	github.com/moby/spdystream v0.2.0 // indirect
	github.com/moby/term v0.0.0-20210619224110-3f7ff695adc6 // indirect
	github.com/modern-go/concurrent v0.0.0-20180306012644-bacd9c7ef1dd // indirect
	github.com/modern-go/reflect2 v1.0.2 // indirect
	github.com/morikuni/aec v1.0.0 // indirect
	github.com/munnerz/goautoneg v0.0.0-20191010083416-a7dc8b61c822 // indirect
	github.com/opencontainers/go-digest v1.0.0 // indirect
	github.com/opencontainers/image-spec v1.0.2 // indirect
	github.com/pmezard/go-difflib v1.0.0 // indirect
	github.com/sergi/go-diff v1.1.0 // indirect
	github.com/sirupsen/logrus v1.8.1 // indirect
	github.com/spf13/pflag v1.0.5 // indirect
	github.com/tomasen/realip v0.0.0-20180522021738-f0c99a92ddce // indirect
	github.com/x448/float16 v0.8.4 // indirect
	github.com/xanzy/ssh-agent v0.3.0 // indirect
	github.com/xeipuuv/gojsonpointer v0.0.0-20180127040702-4e3ac2762d5f // indirect
	github.com/xeipuuv/gojsonreference v0.0.0-20180127040603-bd5ef7bd5415 // indirect
	github.com/xeipuuv/gojsonschema v1.2.0 // indirect
	golang.org/x/net v0.2.0 // indirect
	golang.org/x/sys v0.5.0 // indirect
	golang.org/x/term v0.2.0 // indirect
	golang.org/x/text v0.4.0 // indirect
	golang.org/x/time v0.0.0-20220210224613-90d013bbcef8 // indirect
	google.golang.org/appengine v1.6.7 // indirect
	google.golang.org/protobuf v1.28.0 // indirect
	gopkg.in/inf.v0 v0.9.1 // indirect
	gopkg.in/warnings.v0 v0.1.2 // indirect
	gopkg.in/yaml.v2 v2.4.0 // indirect
	gotest.tools/v3 v3.0.3 // indirect
	k8s.io/klog/v2 v2.70.1 // indirect
	k8s.io/kube-openapi v0.0.0-20220803162953-67bda5d908f1 // indirect
	k8s.io/utils v0.0.0-20220728103510-ee6ede2d64ed // indirect
	sigs.k8s.io/json v0.0.0-20220713155537-f223a00ba0e2 // indirect
	sigs.k8s.io/structured-merge-diff/v4 v4.2.3 // indirect
	sigs.k8s.io/yaml v1.2.0 // indirect
)
