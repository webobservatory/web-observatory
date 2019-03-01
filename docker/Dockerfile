FROM centos:7
MAINTAINER Maxim Bashevoy m.bashevoy@soton.ac.uk

RUN yum -y update && yum install -y deltarpm

# TODO: check if we need all gcc
RUN yum install -y \
  curl \
  make \
  gcc* \
  sudo \
  krb5-devel \
  bzip2 \
  && rm -rf /var/cache/yum/* \
  && yum clean all

ENV user docker

RUN useradd -m -d /home/${user} ${user} \
 && chown -R ${user} /home/${user}
USER ${user}
WORKDIR /home/${user}

RUN curl https://install.meteor.com/ | sh
ENV PATH="/home/${user}/.meteor:${PATH}"
RUN meteor --version

CMD /startup.sh
