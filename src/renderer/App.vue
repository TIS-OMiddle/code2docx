<template>
  <div id="app" class="container">
    <el-form label-position="left" label-width="100px" :model="form" class="form">
      <el-form-item label="选择目录" required prop="path">
        <el-input v-model="form.path" placeholder="选择代码所在目录">
          <el-button slot="append" @click="chooesPath" icon="el-icon-search"></el-button>
        </el-input>
      </el-form-item>
      <el-form-item label="文件名正则" required prop="regexp">
        <el-input v-model="form.regexp" placeholder="\.java$,\.php$,\.vue$" />
      </el-form-item>
      <el-form-item>
        <el-button type="primary" @click="onExportClick">一键生成</el-button>
      </el-form-item>
    </el-form>
    <div>
      <p>
        1.正则表达式以英文逗号','分隔为多个表达式，多个表达式的关系是
        <strong>或</strong>
      </p>
      <p>
        2.正则会对所选目录下的所有文件
        <strong>绝对路径</strong>
        进行匹配，而不仅仅是文件名
      </p>
      <p>3.正则规范与js正则规范相同,'\.'是转义符号以匹配点号，‘$’代表匹配结尾</p>
      <p>4.一般只需匹配文件后缀名即可，如示例中将匹配所有java、php、vue后缀名文件</p>
      <p>5.不含目录，文件名将作为1级标题，内容作为正文，其它需求自行实现</p>
    </div>
  </div>
</template>


<script>
import { translate } from "./utils";
import { remote } from "electron";
import { Packer } from "docx";
import { saveAs } from "file-saver";
const { dialog } = remote;

export default {
  name: "code2docx",
  data() {
    return {
      form: {
        path: null,
        regexp: null,
        exporting: false
      }
    };
  },
  methods: {
    chooesPath() {
      const paths = dialog.showOpenDialog({ properties: ["openDirectory"] });
      if (paths && paths.length) {
        this.form.path = paths[0];
      }
    },
    async onExportClick() {
      if (this.exporting) return;
      if (this.form.path && this.form.regexp) {
        try {
          this.exporting = true;
          this.$message("正在执行...");
          const regs = this.form.regexp.split(",").map(str => new RegExp(str));
          const docx = await translate(this.form.path, regs);
          const blob = await Packer.toBlob(docx);
          saveAs(blob, "代码.docx");
        } finally {
          this.exporting = false;
        }
      }
    }
  }
};
</script>

<style>
.container {
  display: flex;
  width: 100vw;
  height: 100vh;
  justify-content: center;
  align-items: center;
  flex-direction: column;
}

.form {
  margin-bottom: 20px;
  width: 600px;
}
</style>
